import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Target, Layers, Clock, X,
  Loader2, RefreshCw, Trash2, ChevronDown, Plus, History
} from 'lucide-react';
import { TrailingStopForm, OCOOrderForm, BracketOrderForm } from '../../components/trading';
import api from '../../services/api';

const AdvancedOrdersPage = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orderType, setOrderType] = useState(null);
  const [orders, setOrders] = useState({
    trailing_stops: [],
    oco_orders: [],
    bracket_orders: []
  });
  const [history, setHistory] = useState({
    trailing_stops: [],
    oco_orders: [],
    bracket_orders: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [currentPrice, setCurrentPrice] = useState(1.08500);

  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [activeRes, historyRes] = await Promise.all([
        api.get('/orders/active'),
        api.get('/orders/history')
      ]);
      setOrders(activeRes.data.orders || { trailing_stops: [], oco_orders: [], bracket_orders: [] });
      setHistory(historyRes.data || { trailing_stops: [], oco_orders: [], bracket_orders: [] });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (type, orderId) => {
    try {
      const endpoint = type === 'trailing_stop' ? 'trailing-stop'
        : type === 'oco' ? 'oco'
        : 'bracket';
      await api.delete(`/orders/${endpoint}/${orderId}`);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const cancelAllOrders = async () => {
    if (!confirm('Cancel all active orders?')) return;
    try {
      await api.post('/orders/cancel-all');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling orders:', error);
    }
  };

  const totalActiveOrders =
    orders.trailing_stops.length +
    orders.oco_orders.length +
    orders.bracket_orders.length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'filled':
      case 'triggered':
        return 'text-green-400 bg-green-500/20';
      case 'cancelled':
        return 'text-gray-400 bg-gray-500/20';
      case 'expired':
        return 'text-orange-400 bg-orange-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const OrderCard = ({ order, type, onCancel }) => (
    <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            type === 'trailing_stop' ? 'bg-orange-500/20' :
            type === 'oco' ? 'bg-purple-500/20' : 'bg-blue-500/20'
          }`}>
            {type === 'trailing_stop' ? <TrendingUp className="w-5 h-5 text-orange-400" /> :
             type === 'oco' ? <Target className="w-5 h-5 text-purple-400" /> :
             <Layers className="w-5 h-5 text-blue-400" />}
          </div>
          <div>
            <h4 className="font-semibold text-white">{order.symbol}</h4>
            <p className="text-xs text-gray-500">
              {type === 'trailing_stop' ? 'Trailing Stop' :
               type === 'oco' ? 'OCO Order' : 'Bracket Order'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {type === 'trailing_stop' && (
          <>
            <div>
              <p className="text-xs text-gray-500">Side</p>
              <p className={`font-medium ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {order.side.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Quantity</p>
              <p className="font-medium text-white">{order.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Trail</p>
              <p className="font-medium text-white">
                {order.trail_type === 'percent' ? `${order.trail_percent}%` : order.trail_amount}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Stop</p>
              <p className="font-medium text-white">{order.current_stop_price || '-'}</p>
            </div>
          </>
        )}

        {type === 'oco' && (
          <>
            <div>
              <p className="text-xs text-gray-500">Take Profit</p>
              <p className="font-medium text-green-400">{order.order1?.price}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stop Loss</p>
              <p className="font-medium text-red-400">{order.order2?.price}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Quantity</p>
              <p className="font-medium text-white">{order.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Executed</p>
              <p className="font-medium text-white">{order.executed_order ? `Order ${order.executed_order}` : '-'}</p>
            </div>
          </>
        )}

        {type === 'bracket' && (
          <>
            <div>
              <p className="text-xs text-gray-500">Side</p>
              <p className={`font-medium ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {order.side.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Entry</p>
              <p className="font-medium text-white">
                {order.entry?.filled_price || order.entry?.price || 'Market'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Take Profit</p>
              <p className="font-medium text-green-400">{order.take_profit?.price}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stop Loss</p>
              <p className="font-medium text-red-400">{order.stop_loss?.price}</p>
            </div>
          </>
        )}
      </div>

      {order.status === 'active' || order.status === 'pending' ? (
        <button
          onClick={() => onCancel(type.replace('_orders', '').replace('_', '-'), order.id)}
          className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel Order
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Advanced Orders</h1>
          <p className="text-gray-400">Trailing stops, OCO, and bracket orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {totalActiveOrders > 0 && (
            <button
              onClick={cancelAllOrders}
              className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cancel All
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Active Orders ({totalActiveOrders})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 inline-block mr-2" />
          Create Order
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4 inline-block mr-2" />
          History
        </button>
      </div>

      {/* Active Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : totalActiveOrders === 0 ? (
            <div className="text-center py-12 bg-[#1a1a2e] rounded-xl border border-gray-800">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No active advanced orders</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Create Your First Order
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Trailing Stops */}
              {orders.trailing_stops.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Trailing Stops ({orders.trailing_stops.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.trailing_stops.map(order => (
                      <OrderCard key={order.id} order={order} type="trailing_stop" onCancel={cancelOrder} />
                    ))}
                  </div>
                </div>
              )}

              {/* OCO Orders */}
              {orders.oco_orders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    OCO Orders ({orders.oco_orders.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.oco_orders.map(order => (
                      <OrderCard key={order.id} order={order} type="oco" onCancel={cancelOrder} />
                    ))}
                  </div>
                </div>
              )}

              {/* Bracket Orders */}
              {orders.bracket_orders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    Bracket Orders ({orders.bracket_orders.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.bracket_orders.map(order => (
                      <OrderCard key={order.id} order={order} type="bracket" onCancel={cancelOrder} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Order Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Symbol & Price Selection */}
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Symbol</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {symbols.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Current Price</label>
                <div className="px-4 py-2 bg-gray-800 rounded-lg text-white font-mono">
                  {currentPrice.toFixed(5)}
                </div>
              </div>
            </div>
          </div>

          {/* Order Type Selection */}
          {!orderType ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setOrderType('trailing')}
                className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6 hover:border-orange-500/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Trailing Stop</h3>
                <p className="text-sm text-gray-400">
                  Stop that follows price movement to lock in profits
                </p>
              </button>

              <button
                onClick={() => setOrderType('oco')}
                className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">OCO Order</h3>
                <p className="text-sm text-gray-400">
                  Take Profit + Stop Loss - one cancels the other
                </p>
              </button>

              <button
                onClick={() => setOrderType('bracket')}
                className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6 hover:border-blue-500/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Bracket Order</h3>
                <p className="text-sm text-gray-400">
                  Entry + Take Profit + Stop Loss in one order
                </p>
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setOrderType(null)}
                className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Back to order types
              </button>

              <div className="max-w-lg">
                {orderType === 'trailing' && (
                  <TrailingStopForm
                    symbol={selectedSymbol}
                    side="sell"
                    onClose={() => setOrderType(null)}
                    onSuccess={() => {
                      setOrderType(null);
                      fetchOrders();
                    }}
                  />
                )}

                {orderType === 'oco' && (
                  <OCOOrderForm
                    symbol={selectedSymbol}
                    positionSide="long"
                    currentPrice={currentPrice}
                    onClose={() => setOrderType(null)}
                    onSuccess={() => {
                      setOrderType(null);
                      fetchOrders();
                    }}
                  />
                )}

                {orderType === 'bracket' && (
                  <BracketOrderForm
                    symbol={selectedSymbol}
                    currentPrice={currentPrice}
                    onClose={() => setOrderType(null)}
                    onSuccess={() => {
                      setOrderType(null);
                      fetchOrders();
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-[#1a1a2e] rounded-xl border border-gray-800">
          {(history.trailing_stops.length + history.oco_orders.length + history.bracket_orders.length) === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No order history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Type</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Symbol</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Side</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.trailing_stops.map(order => (
                    <tr key={`ts-${order.id}`} className="border-b border-gray-800/50">
                      <td className="px-6 py-4">
                        <span className="text-orange-400">Trailing Stop</span>
                      </td>
                      <td className="px-6 py-4 text-white">{order.symbol}</td>
                      <td className="px-6 py-4">
                        <span className={order.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {history.oco_orders.map(order => (
                    <tr key={`oco-${order.id}`} className="border-b border-gray-800/50">
                      <td className="px-6 py-4">
                        <span className="text-purple-400">OCO</span>
                      </td>
                      <td className="px-6 py-4 text-white">{order.symbol}</td>
                      <td className="px-6 py-4 text-gray-400">-</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {history.bracket_orders.map(order => (
                    <tr key={`br-${order.id}`} className="border-b border-gray-800/50">
                      <td className="px-6 py-4">
                        <span className="text-blue-400">Bracket</span>
                      </td>
                      <td className="px-6 py-4 text-white">{order.symbol}</td>
                      <td className="px-6 py-4">
                        <span className={order.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.exit_reason || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedOrdersPage;
