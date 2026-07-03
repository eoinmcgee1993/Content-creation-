"""Galileo Grid — Fibonacci-anchored grid bot."""
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.model.data import Bar, BarType
from nautilus_trader.model.enums import OrderSide, TimeInForce
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.objects import Price, Quantity
from nautilus_trader.trading.strategy import Strategy


class GalileoGridConfig(StrategyConfig, frozen=True):
    instrument_id: InstrumentId
    bar_type: BarType
    grid_levels: int = 10
    grid_spacing_pct: float = 0.01  # 1 % between levels
    order_size: Decimal = Decimal("0.01")


class GalileoGrid(Strategy):
    """
    Geometric buy/sell grid anchored on Fibonacci retracements.

    Places limit orders above and below a reference price with spacing
    derived from the golden ratio (0.618 / 1.618 multiples).
    """

    FIBO_RATIOS = (0.236, 0.382, 0.500, 0.618, 0.786)

    def __init__(self, config: GalileoGridConfig) -> None:
        super().__init__(config)
        self.instrument_id = config.instrument_id
        self.bar_type = config.bar_type
        self.grid_levels = config.grid_levels
        self.grid_spacing_pct = config.grid_spacing_pct
        self.order_size = config.order_size
        self._reference_price: float | None = None
        self._grid_placed = False

    def on_start(self) -> None:
        self.subscribe_bars(self.bar_type)

    def on_bar(self, bar: Bar) -> None:
        mid = float(bar.close)
        if self._reference_price is None:
            self._reference_price = mid
            self._place_grid(mid)
            return

        # Re-anchor if price drifts more than half the outer grid band
        drift_pct = abs(mid - self._reference_price) / self._reference_price
        outer = self.grid_spacing_pct * self.grid_levels / 2
        if drift_pct > outer * 0.5:
            self.cancel_all_orders(self.instrument_id)
            self._reference_price = mid
            self._grid_placed = False
            self._place_grid(mid)

    def _place_grid(self, mid: float) -> None:
        instrument = self.cache.instrument(self.instrument_id)
        half = self.grid_levels // 2
        for i in range(1, half + 1):
            fib = self.FIBO_RATIOS[min(i - 1, len(self.FIBO_RATIOS) - 1)]
            spacing = self.grid_spacing_pct * fib * i

            buy_price = round(mid * (1 - spacing), instrument.price_precision)
            sell_price = round(mid * (1 + spacing), instrument.price_precision)

            self.order_factory.limit(
                instrument_id=self.instrument_id,
                order_side=OrderSide.BUY,
                quantity=Quantity(self.order_size, instrument.size_precision),
                price=Price(buy_price, instrument.price_precision),
                time_in_force=TimeInForce.GTC,
            )
            self.order_factory.limit(
                instrument_id=self.instrument_id,
                order_side=OrderSide.SELL,
                quantity=Quantity(self.order_size, instrument.size_precision),
                price=Price(sell_price, instrument.price_precision),
                time_in_force=TimeInForce.GTC,
            )
        self._grid_placed = True

    def on_stop(self) -> None:
        self.cancel_all_orders(self.instrument_id)
        self.close_all_positions(self.instrument_id)
