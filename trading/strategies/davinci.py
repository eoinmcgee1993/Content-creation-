"""Da Vinci Arbitrage — cross-venue price discrepancy capture."""
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.model.data import Bar, BarType, QuoteTick
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.objects import Quantity
from nautilus_trader.trading.strategy import Strategy


class DaVinciConfig(StrategyConfig, frozen=True):
    venue_a_instrument: InstrumentId   # e.g. Exness spot
    venue_b_instrument: InstrumentId   # e.g. Bybit contract
    bar_type_a: BarType
    bar_type_b: BarType
    min_spread_pct: float = 0.002      # 0.20 % minimum edge after fees
    order_size: Decimal = Decimal("0.05")
    max_open_legs: int = 3


class DaVinciArbitrage(Strategy):
    """
    Monitors two venues and fires simultaneous buy/sell legs whenever
    the bid-ask spread between them exceeds min_spread_pct.
    """

    def __init__(self, config: DaVinciConfig) -> None:
        super().__init__(config)
        self.venue_a = config.venue_a_instrument
        self.venue_b = config.venue_b_instrument
        self.bar_type_a = config.bar_type_a
        self.bar_type_b = config.bar_type_b
        self.min_spread_pct = config.min_spread_pct
        self.order_size = config.order_size
        self.max_open_legs = config.max_open_legs
        self._last_a: float | None = None
        self._last_b: float | None = None
        self._open_legs = 0

    def on_start(self) -> None:
        self.subscribe_bars(self.bar_type_a)
        self.subscribe_bars(self.bar_type_b)

    def on_bar(self, bar: Bar) -> None:
        bar_type = bar.bar_type
        close = float(bar.close)

        if bar_type == self.bar_type_a:
            self._last_a = close
        elif bar_type == self.bar_type_b:
            self._last_b = close

        if self._last_a is None or self._last_b is None:
            return
        if self._open_legs >= self.max_open_legs:
            return

        spread = (self._last_b - self._last_a) / self._last_a

        if spread > self.min_spread_pct:
            # A is cheaper: buy A, sell B
            self._fire_arb(buy_venue=self.venue_a, sell_venue=self.venue_b)
        elif spread < -self.min_spread_pct:
            # B is cheaper: buy B, sell A
            self._fire_arb(buy_venue=self.venue_b, sell_venue=self.venue_a)

    def _fire_arb(self, buy_venue: InstrumentId, sell_venue: InstrumentId) -> None:
        inst_buy = self.cache.instrument(buy_venue)
        inst_sell = self.cache.instrument(sell_venue)
        qty_buy = Quantity(self.order_size, inst_buy.size_precision)
        qty_sell = Quantity(self.order_size, inst_sell.size_precision)

        self.order_factory.market(
            instrument_id=buy_venue,
            order_side=OrderSide.BUY,
            quantity=qty_buy,
        )
        self.order_factory.market(
            instrument_id=sell_venue,
            order_side=OrderSide.SELL,
            quantity=qty_sell,
        )
        self._open_legs += 1

    def on_position_closed(self, event) -> None:
        if self._open_legs > 0:
            self._open_legs -= 1

    def on_stop(self) -> None:
        self.cancel_all_orders(self.venue_a)
        self.cancel_all_orders(self.venue_b)
        self.close_all_positions(self.venue_a)
        self.close_all_positions(self.venue_b)
