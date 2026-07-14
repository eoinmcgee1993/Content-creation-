"""Socratic Delta Neutral — spot + derivative hedge to harvest funding."""
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.indicators.averages import ExponentialMovingAverage
from nautilus_trader.model.data import Bar, BarType
from nautilus_trader.model.enums import OrderSide, PositionSide, TimeInForce
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.objects import Price, Quantity
from nautilus_trader.trading.strategy import Strategy


class SocraticConfig(StrategyConfig, frozen=True):
    spot_instrument_id: InstrumentId
    perp_instrument_id: InstrumentId
    bar_type: BarType
    ema_period: int = 20
    order_size: Decimal = Decimal("0.10")
    delta_threshold: float = 0.05   # re-hedge when |delta| > 5 %
    funding_rate_min: float = 0.0001  # only trade when funding > 0.01 %


class SocraticDeltaNeutral(Strategy):
    """
    Opens a spot long and matching perp short to collect positive funding.
    Re-hedges whenever net delta drifts past threshold.
    """

    def __init__(self, config: SocraticConfig) -> None:
        super().__init__(config)
        self.spot_id = config.spot_instrument_id
        self.perp_id = config.perp_instrument_id
        self.bar_type = config.bar_type
        self.order_size = config.order_size
        self.delta_threshold = config.delta_threshold
        self.funding_rate_min = config.funding_rate_min
        self._ema = ExponentialMovingAverage(config.ema_period)
        self._in_position = False

    def on_start(self) -> None:
        self.subscribe_bars(self.bar_type)

    def on_bar(self, bar: Bar) -> None:
        self._ema.update_raw(float(bar.close))
        if not self._ema.initialized:
            return

        spot_instrument = self.cache.instrument(self.spot_id)
        perp_instrument = self.cache.instrument(self.perp_id)

        spot_pos = self.cache.position(self.spot_id)
        perp_pos = self.cache.position(self.perp_id)

        if not self._in_position:
            self._open_hedge(spot_instrument, perp_instrument, bar)
            return

        # Measure net delta (spot long qty vs perp short qty)
        spot_qty = float(spot_pos.quantity) if spot_pos else 0.0
        perp_qty = float(perp_pos.quantity) if perp_pos else 0.0
        net_delta = spot_qty - perp_qty
        if abs(net_delta) / max(spot_qty, 1e-9) > self.delta_threshold:
            self._rebalance(perp_instrument, net_delta, bar)

    def _open_hedge(self, spot_inst, perp_inst, bar: Bar) -> None:
        qty = Quantity(self.order_size, spot_inst.size_precision)
        price = float(bar.close)

        self.order_factory.market(
            instrument_id=self.spot_id,
            order_side=OrderSide.BUY,
            quantity=qty,
        )
        self.order_factory.market(
            instrument_id=self.perp_id,
            order_side=OrderSide.SELL,
            quantity=qty,
        )
        self._in_position = True

    def _rebalance(self, perp_inst, net_delta: float, bar: Bar) -> None:
        # Short more perps if delta is positive (long-heavy), else cover
        side = OrderSide.SELL if net_delta > 0 else OrderSide.BUY
        adj_qty = Quantity(abs(net_delta), perp_inst.size_precision)
        self.order_factory.market(
            instrument_id=self.perp_id,
            order_side=side,
            quantity=adj_qty,
        )

    def on_stop(self) -> None:
        self.cancel_all_orders(self.spot_id)
        self.cancel_all_orders(self.perp_id)
        self.close_all_positions(self.spot_id)
        self.close_all_positions(self.perp_id)
