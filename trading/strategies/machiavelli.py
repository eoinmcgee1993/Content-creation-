"""Machiavelli Market Maker — asymmetric spread capture during high volatility."""
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.indicators.volatility import AverageTrueRange
from nautilus_trader.model.data import Bar, BarType
from nautilus_trader.model.enums import OrderSide, TimeInForce
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.objects import Price, Quantity
from nautilus_trader.trading.strategy import Strategy


class MachiavelliConfig(StrategyConfig, frozen=True):
    instrument_id: InstrumentId
    bar_type: BarType
    atr_period: int = 14
    spread_atr_multiple: float = 0.5   # quote at ±0.5 × ATR around mid
    min_spread_pct: float = 0.001      # floor: never quote tighter than 0.10 %
    order_size: Decimal = Decimal("0.02")
    max_inventory: Decimal = Decimal("0.10")  # net position cap
    refresh_every_n_bars: int = 1


class MachiavelliMarketMaker(Strategy):
    """
    Continuously posts a bid and an offer around the fair-value mid.
    Quote width scales with ATR so it widens in volatile conditions.
    Inventory skew adjusts prices to stay inside the max_inventory cap.
    """

    def __init__(self, config: MachiavelliConfig) -> None:
        super().__init__(config)
        self.instrument_id = config.instrument_id
        self.bar_type = config.bar_type
        self.atr_multiple = config.spread_atr_multiple
        self.min_spread_pct = config.min_spread_pct
        self.order_size = config.order_size
        self.max_inventory = float(config.max_inventory)
        self.refresh_every = config.refresh_every_n_bars
        self._atr = AverageTrueRange(config.atr_period)
        self._bar_count = 0
        self._bid_id = None
        self._ask_id = None

    def on_start(self) -> None:
        self.subscribe_bars(self.bar_type)

    def on_bar(self, bar: Bar) -> None:
        self._atr.update_raw(float(bar.high), float(bar.low), float(bar.close))
        if not self._atr.initialized:
            return

        self._bar_count += 1
        if self._bar_count % self.refresh_every != 0:
            return

        self._refresh_quotes(bar)

    def _refresh_quotes(self, bar: Bar) -> None:
        instrument = self.cache.instrument(self.instrument_id)
        mid = float(bar.close)
        half_spread = max(
            self._atr.value * self.atr_multiple / 2,
            mid * self.min_spread_pct / 2,
        )

        # Inventory skew: shift quotes to lean against a growing position
        position = self.cache.position(self.instrument_id)
        net = float(position.quantity) if position else 0.0
        skew = (net / self.max_inventory) * half_spread if self.max_inventory else 0.0

        bid_px = round(mid - half_spread - skew, instrument.price_precision)
        ask_px = round(mid + half_spread - skew, instrument.price_precision)

        qty = Quantity(self.order_size, instrument.size_precision)

        # Cancel existing quotes before re-posting
        self.cancel_all_orders(self.instrument_id)

        # Don't quote a side that would breach inventory cap
        if net < self.max_inventory:
            self.order_factory.limit(
                instrument_id=self.instrument_id,
                order_side=OrderSide.BUY,
                quantity=qty,
                price=Price(bid_px, instrument.price_precision),
                time_in_force=TimeInForce.GTC,
            )
        if net > -self.max_inventory:
            self.order_factory.limit(
                instrument_id=self.instrument_id,
                order_side=OrderSide.SELL,
                quantity=qty,
                price=Price(ask_px, instrument.price_precision),
                time_in_force=TimeInForce.GTC,
            )

    def on_stop(self) -> None:
        self.cancel_all_orders(self.instrument_id)
        self.close_all_positions(self.instrument_id)
