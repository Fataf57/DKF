import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getCustomers, getProducts } from '../services/api';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getOrders(params);
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      alert('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  const statusColors = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  const statusLabels = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1>Commandes</h1>
          <p>Gérez toutes vos commandes</p>
        </div>
      </div>

      <div className="filters-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : (
        <div className="orders-table-container">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>Aucune commande trouvée</p>
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-number">{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="status-select"
                        style={{ 
                          backgroundColor: `${statusColors[order.status]}20`,
                          color: statusColors[order.status],
                          borderColor: statusColors[order.status]
                        }}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="order-amount">
                      {parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button className="btn-view">Voir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Orders;

