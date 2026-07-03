"""Michelangelo Momentum — EMA crossover + volume breakout."""
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.indicators.averages import ExponentialMovingAverage
from nautilus_trader.model.data import Bar, BarType
from nautilus_trader.model.enums import OrderSide, TimeInForce
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.objects import Price, Quantity
from nautilus_trader.trading.strategy import Strategy


class MichelangeloConfig(StrategyConfig, frozen=True):
    instrument_id: InstrumentId
    bar_type: BarType
    fast_ema: int = 12
    slow_ema: int = 26
    volume_multiplier: float = 1.5   # volume must be N× its own EMA to enter
    volume_ema_period: int = 20
    order_size: Decimal = Decimal("0.05")
    trail_pct: float = 0.015         # 1.5 % trailing stop


class MichelangeloMomentum(Strategy):
    """
    Enters on a bullish EMA crossover confirmed by a volume surge,
    then manages the trade with a percentage trailing stop.
    """

    def __init__(self, config: MichelangeloConfig) -> None:
        super().__init__(config)
        self.instrument_id = config.instrument_id
        self.bar_type = config.bar_type
        self.order_size = config.order_size
        self.volume_multiplier = config.volume_multiplier
        self.trail_pct = config.trail_pct
        self._fast_ema = ExponentialMovingAverage(config.fast_ema)
        self._slow_ema = ExponentialMovingAverage(config.slow_ema)
        self._vol_ema = ExponentialMovingAverage(config.volume_ema_period)
        self._in_long = False
        self._trail_stop: float | None = None
        self._last_fast: float | None = None
        self._last_slow: float | None = None

    def on_start(self) -> None:
        self.subscribe_bars(self.bar_type)

    def on_bar(self, bar: Bar) -> None:
        close = float(bar.close)
        volume = float(bar.volume)

        self._fast_ema.update_raw(close)
        self._slow_ema.update_raw(close)
        self._vol_ema.update_raw(volume)

        if not (self._fast_ema.initialized and self._slow_ema.initialized and self._vol_ema.initialized):
            self._last_fast = self._fast_ema.value
            self._last_slow = self._slow_ema.value
            return

        fast, slow = self._fast_ema.value, self._slow_ema.value
        vol_threshold = self._vol_ema.value * self.volume_multiplier

        # Check trailing stop first
        if self._in_long and self._trail_stop is not None:
            new_stop = close * (1 - self.trail_pct)
            self._trail_stop = max(self._trail_stop, new_stop)
            if close < self._trail_stop:
                self._exit(bar)
                return

        # Bullish crossover + volume confirmation
        crossed_up = (
            self._last_fast is not None
            and self._last_fast <= self._last_slow
            and fast > slow
        )
        if crossed_up and volume >= vol_threshold and not self._in_long:
            self._enter(bar)

        # Bearish crossover → exit
        crossed_down = (
            self._last_fast is not None
            and self._last_fast >= self._last_slow
            and fast < slow
        )
        if crossed_down and self._in_long:
            self._exit(bar)

        self._last_fast = fast
        self._last_slow = slow

    def _enter(self, bar: Bar) -> None:
        instrument = self.cache.instrument(self.instrument_id)
        self.order_factory.market(
            instrument_id=self.instrument_id,
            order_side=OrderSide.BUY,
            quantity=Quantity(self.order_size, instrument.size_precision),
        )
        self._in_long = True
        self._trail_stop = float(bar.close) * (1 - self.trail_pct)

    def _exit(self, bar: Bar) -> None:
        instrument = self.cache.instrument(self.instrument_id)
        self.order_factory.market(
            instrument_id=self.instrument_id,
            order_side=OrderSide.SELL,
            quantity=Quantity(self.order_size, instrument.size_precision),
        )
        self._in_long = False
        self._trail_stop = None

    def on_stop(self) -> None:
        self.cancel_all_orders(self.instrument_id)
        self.close_all_positions(self.instrument_id)
