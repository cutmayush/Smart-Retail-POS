import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import RevenueAreaChart from '@/components/charts/RevenueAreaChart';
import DataTable from '@/components/common/DataTable';
import { formatCurrency } from '@/lib/utils';
import { dashboardService } from '@/services/dashboardService';
import { productService } from '@/services/productService';
import useAutoRefresh from '@/hooks/useAutoRefresh';

function ReportsPage() {
  const [reportHighlights, setReportHighlights] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [highlights, revenue, products] = await Promise.all([
        dashboardService.getReportHighlights(),
        dashboardService.getRevenueTrend(),
        productService.getTop(5),
      ]);
      setReportHighlights(highlights);
      setRevenueData(revenue);
      setTopProducts(products);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load reports');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAutoRefresh(() => load(true));

  const exportReport = async (type) => {
    const rows = [
      ['Metric', 'Value'],
      ...reportHighlights.map(({ label, value }) => [label, value]),
      [],
      ['Top product', 'Units sold', 'Revenue'],
      ...topProducts.map(({ name, sold, revenue }) => [name, sold, revenue]),
    ];

    if (type === 'CSV') {
      const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `retail-report-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV report exported');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text('Smart Retail POS Report', 14, 20);
      pdf.setFontSize(11);
      let y = 32;
      reportHighlights.forEach(({ label, value }) => {
        pdf.text(`${label}: ${formatCurrency(value)}`, 14, y);
        y += 8;
      });
      y += 4;
      pdf.setFontSize(14);
      pdf.text('Top products', 14, y);
      y += 9;
      pdf.setFontSize(10);
      topProducts.forEach(({ name, sold, revenue }) => {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(`${name} - ${sold} units - ${formatCurrency(revenue)}`, 14, y);
        y += 7;
      });
      pdf.save(`retail-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF report exported');
    } catch (error) {
      toast.error(error.message || 'Could not export PDF report');
    }
  };

  const columns = [
    { key: 'name', title: 'Top product' },
    { key: 'sold', title: 'Units sold' },
    { key: 'revenue', title: 'Revenue', render: (value) => formatCurrency(value) },
  ];

  return (
    <div className="page-section">
      <PageHeader
        title="Reports & analytics"
        description="Generate daily, weekly and monthly sales intelligence with downloadable exports for finance and operations teams."
        actions={
          <>
            <Button variant="secondary" onClick={() => exportReport('CSV')}><HiOutlineArrowDownTray className="mr-2" size={18} /> Export CSV</Button>
            <Button onClick={() => exportReport('PDF')}>Export PDF</Button>
          </>
        }
      />

      {loading ? (
        <div className="card-panel p-10 text-center text-sm text-slate-500">Loading reports...</div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {reportHighlights.map((item) => (
              <div key={item.label} className="card-panel p-5">
                <p className="text-sm text-slate-500">{item.label}</p>
                <h3 className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(item.value)}</h3>
                {item.delta ? <p className="mt-2 text-sm font-semibold text-accent-600">{item.delta}</p> : null}
              </div>
            ))}
          </div>

          <RevenueAreaChart data={revenueData} />
          <DataTable columns={columns} data={topProducts} />
        </>
      )}
    </div>
  );
}

export default ReportsPage;
