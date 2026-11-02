import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/common/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { inventoryService } from '@/services/inventoryService';
import useAutoRefresh from '@/hooks/useAutoRefresh';

function InventoryPage() {
  const role = useAuthStore((state) => state.user?.role);
  const canAdjustStock = role === 'Admin' || role === 'Manager';
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ activeWarehouses: 0, lowStockCount: 0, sellingChannels: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [quantities, setQuantities] = useState({});

  const loadInventory = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [inventory, inventorySummary] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getSummary(),
      ]);
      setItems(inventory);
      setSummary(inventorySummary);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load inventory');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useAutoRefresh(() => loadInventory(true));

  const updateStock = async (item, direction) => {
    const quantity = Number(quantities[item.productId] ?? 1);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      toast.error('Enter a positive whole-number quantity');
      return;
    }

    if (direction < 0 && quantity > item.stock) {
      toast.error(`Only ${item.stock} units are available to remove`);
      return;
    }

    const delta = direction * quantity;
    setUpdatingProductId(item.productId);
    try {
      const { product, log } = await inventoryService.adjustStock(
        item.productId,
        delta,
        delta > 0 ? 'Stock in' : 'Stock out',
      );
      setItems((currentItems) => currentItems.map((currentItem) => (
        currentItem.productId === item.productId
          ? {
            ...currentItem,
            stock: product.stock,
            movement: `${log.change > 0 ? '+' : ''}${log.change}`,
          }
          : currentItem
      )));
      const wasLowStock = item.stock <= item.threshold;
      const isLowStock = product.stock <= item.threshold;
      if (wasLowStock !== isLowStock) {
        setSummary((currentSummary) => ({
          ...currentSummary,
          lowStockCount: Math.max(0, currentSummary.lowStockCount + (isLowStock ? 1 : -1)),
        }));
      }
      toast.success(delta > 0 ? 'Stock added successfully' : 'Stock removed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update stock');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const columns = [
    { key: 'product', title: 'Product' },
    { key: 'store', title: 'Store' },
    { key: 'warehouse', title: 'Warehouse' },
    {
      key: 'stock',
      title: 'Stock',
      render: (value, row) => (
        <Badge tone={value <= row.threshold ? 'amber' : 'emerald'}>
          {value} units
        </Badge>
      ),
    },
    { key: 'movement', title: 'Recent Movement', render: (value) => `${value} units` },
    ...(canAdjustStock ? [{
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={quantities[row.productId] ?? 1}
            aria-label={`Quantity to adjust for ${row.product}`}
            disabled={updatingProductId === row.productId}
            onChange={(event) => setQuantities((current) => ({
              ...current,
              [row.productId]: event.target.value,
            }))}
            className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
          />
          <Button
            variant="secondary"
            className="px-3 py-2 text-xs"
            disabled={updatingProductId === row.productId}
            onClick={() => updateStock(row, 1)}
          >
            Add
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-2 text-xs"
            disabled={updatingProductId === row.productId || row.stock < Number(quantities[row.productId] ?? 1)}
            onClick={() => updateStock(row, -1)}
          >
            Subtract
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="page-section">
      <PageHeader
        title="Inventory Management"
        description="Track stock across warehouses and stores, view movement history and respond instantly to low-stock alerts."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-panel p-5">
          <p className="text-sm text-slate-500">Warehouse Stock</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {summary.activeWarehouses} active hubs
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Centralized replenishment serving retail, kiosks and online orders.
          </p>
        </div>

        <div className="card-panel p-5">
          <p className="text-sm text-slate-500">Low Stock Alerts</p>
          <h3 className="mt-3 text-3xl font-bold text-amber-500">
            {summary.lowStockCount} critical SKUs
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Threshold-based alerts to trigger procurement and store transfers.
          </p>
        </div>

        <div className="card-panel p-5">
          <p className="text-sm text-slate-500">Multi-Store Coverage</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {summary.sellingChannels} selling channels
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Physical stores, kiosks, wholesale and online inventory views.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card-panel p-10 text-center text-sm text-slate-500">Loading inventory...</div>
      ) : (
        <DataTable columns={columns} data={items} />
      )}
    </div>
  );
}

export default InventoryPage;
