'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/data-table/data-table';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const pageSize = 10;

  useEffect(() => {
    fetch(`/api/products?page=${page}&pageSize=${pageSize}&sort=${sortKey}&dir=${sortDir}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data);
        setTotal(data.total);
      });
  }, [page, sortKey, sortDir]);

  return (
    <DataTable
      columns={[
        { key: 'id', label: '#', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'sku', label: 'SKU', sortable: true },
        { key: 'sn', label: 'SN', sortable: true },
        { key: 'price', label: 'Price', sortable: true },
        { key: 'salePrice', label: 'Sale price', sortable: true },
        { key: 'deliveryPrice', label: 'Delivery price', sortable: true },
        { key: 'quantity', label: 'Quantity', sortable: true },
      ]}
      data={products}
      page={page}
      pageSize={pageSize}
      total={total}
      sortKey={sortKey}
      sortDirection={sortDir}
      onPageChange={setPage}
      onSortChange={(key, dir) => {
        setSortKey(key);
        setSortDir(dir);
      }}
    />
  );
}
