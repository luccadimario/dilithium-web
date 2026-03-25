'use client';

import { useExchangeAuth } from '@/hooks/useExchangeAuth';
import { useExchangeAccount, useUserOrders, useCancelOrder } from '@/hooks/useExchangeAccount';

export default function AccountPanel() {
  const { token, isAuthenticated } = useExchangeAuth();
  const { data: account } = useExchangeAccount(token);
  const { data: orders } = useUserOrders(token);
  const cancelOrder = useCancelOrder(token);

  if (!isAuthenticated) {
    return (
      <div className="card-space p-4">
        <h3 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-3">
          Account
        </h3>
        <p className="text-space-600 text-xs">Sign in to view your account.</p>
      </div>
    );
  }

  const openOrders = (orders ?? []).filter(
    (o: { status: string }) => o.status === 'open' || o.status === 'partial'
  );

  return (
    <div className="card-space p-4">
      <h3 className="font-heading text-sm font-semibold text-white tracking-wide uppercase mb-3">
        Open Orders
      </h3>

      {openOrders.length === 0 ? (
        <p className="text-space-600 text-xs">No open orders.</p>
      ) : (
        <div className="space-y-2">
          {openOrders.map((order: {
            id: number; pair: string; side: string; order_type: string;
            price: number; amount: number; filled: number; status: string
          }) => {
            const remaining = (order.amount - order.filled) / 1e8;
            const isETH = order.pair === 'DLT-ETH';
            const humanPrice = isETH
              ? (order.price / 1e10).toFixed(6)
              : (order.price / 1e8).toFixed(6);

            return (
              <div key={order.id} className="bg-space-900 border border-space-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${
                    order.side === 'buy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {order.side.toUpperCase()} {order.pair}
                  </span>
                  <button
                    onClick={() => cancelOrder.mutate(order.id)}
                    className="text-xs text-space-600 hover:text-red-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div className="text-xs font-mono text-space-600">
                  {order.order_type === 'limit' ? `@ ${humanPrice}` : 'Market'} · {remaining.toFixed(4)} DLT
                  {order.status === 'partial' && <span className="text-nebula-400 ml-1">(partial)</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ETH address display */}
      {account?.eth_address && (
        <div className="mt-4 pt-3 border-t border-space-800">
          <div className="text-xs font-mono text-space-600 mb-1">ETH Identity</div>
          <div className="text-xs font-mono text-space-500 break-all">
            {account.eth_address}
          </div>
          {account.dlt_address && (
            <>
              <div className="text-xs font-mono text-space-600 mt-2 mb-1">Linked DLT</div>
              <div className="text-xs font-mono text-crystal-400 break-all">
                {account.dlt_address}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
