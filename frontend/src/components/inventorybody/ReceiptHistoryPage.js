import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config';
import { FaPrint, FaEye, FaSearch } from 'react-icons/fa';

export default function ReceiptHistoryPage({ onGoBackToPOS, onPrintReceipt, onGoBack }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'receipt', 'customer', 'date'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Function to fetch all receipts from the backend
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/receipts'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReceipts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipt history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Filter receipts based on search term and search type
  const filteredReceipts = receipts.filter((receipt) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const receiptNumber = (receipt.receipt_number || receipt.id).toString().toLowerCase();
    const customerName = (receipt.customer_name || 'guest').toLowerCase();
    const date = new Date(receipt.transaction_date).toLocaleString().toLowerCase();
    
    switch (searchType) {
      case 'receipt':
        return receiptNumber.includes(searchLower);
      case 'customer':
        return customerName.includes(searchLower);
      case 'date':
        return date.includes(searchLower);
      case 'all':
      default:
        return (
          receiptNumber.includes(searchLower) ||
          customerName.includes(searchLower) ||
          date.includes(searchLower)
        );
    }
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewReceiptDetails = async (receiptId) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(apiUrl(`/receipts/${receiptId}`));
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSelectedReceipt(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching receipt details:', err);
      setError('Failed to load receipt details. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedReceipt(null);
    setError(null);
  };

  const handleCloseNotification = () => {
    setShowNotificationModal(false);
    setNotificationMessage('');
    setNotificationType('success');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Notification Modal Component
  const NotificationModal = ({ message, type, onClose }) => (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content">
        <p className={type === 'error' ? 'error-message-text' : 'success-message-text'}>{message}</p>
        <button onClick={onClose} className="custom-modal-button">
          OK
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-message">
        <p>Loading receipt history...</p>
      </div>
    );
  }

  return (
    <div className="receipt-history-container">
      <h2>Receipt History</h2>
      {error && <div className="error-container">{error}</div>}
      
      {selectedReceipt ? (
        loadingDetails ? (
          <div className="loading-message">
            <p>Loading receipt details...</p>
          </div>
        ) : (
          <div className="receipt-details-card">
            <h3>Receipt Details (Receipt No: {selectedReceipt.receipt_number || selectedReceipt.id})</h3>
            <p><strong>Date:</strong> {new Date(selectedReceipt.transaction_date).toLocaleString()}</p>
            <p><strong>Customer:</strong> {selectedReceipt.customer_name || 'N/A'}</p>
            <p><strong>Address:</strong> {selectedReceipt.customer_address || 'N/A'}</p>
            <p><strong>TIN:</strong> {selectedReceipt.customer_tin || 'N/A'}</p>
            <p><strong>Payment Method:</strong> {selectedReceipt.payment_method}</p>

            <h4 className="section-title">Items:</h4>
            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="text-right">Qty</th>
                  <th scope="col" className="text-right">Price</th>
                  <th scope="col" className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedReceipt.cart && selectedReceipt.cart.length > 0 ? (
                  selectedReceipt.cart.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td className="text-right">{parseFloat(item.price).toFixed(2)}</td>
                      <td className="text-right">{(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-items-message">No items for this receipt.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <p className="summary-line"><strong>Subtotal:</strong> {parseFloat(selectedReceipt.total_price).toFixed(2)}</p>
            <p className="summary-line"><strong>Discount ({selectedReceipt.discount_percent}%):</strong> {parseFloat(selectedReceipt.discount_amount).toFixed(2)}</p>
            <p className="summary-line total-line">Net Pay: {parseFloat(selectedReceipt.net_pay).toFixed(2)}</p>
            <p className="summary-line">Cash Given: {parseFloat(selectedReceipt.cash_given).toFixed(2)}</p>
            <p className="summary-line">Change: {parseFloat(selectedReceipt.change_amount).toFixed(2)}</p>
            <p className="summary-line">VATable Sale: {parseFloat(selectedReceipt.vatable_sale).toFixed(2)}</p>
            <p className="summary-line">VAT Amount: {parseFloat(selectedReceipt.vat_amount).toFixed(2)}</p>

            <div className="button-group">
              <button onClick={handleCloseDetails} className="action-button secondary-button">
                Close Details
              </button>
              <button
                onClick={() => {
                  const receiptDataToPrint = {
                    customer: { name: selectedReceipt.customer_name, address: selectedReceipt.customer_address, tin: selectedReceipt.customer_tin },
                    cart: selectedReceipt.cart?.map(item => ({ id: item.product_id, name: item.product_name, quantity: item.quantity, price: item.price })),
                    totalPrice: selectedReceipt.total_price,
                    discountPercent: selectedReceipt.discount_percent,
                    discountAmount: selectedReceipt.discount_amount,
                    netPay: selectedReceipt.net_pay,
                    cashGiven: selectedReceipt.cash_given,
                    change: selectedReceipt.change_amount,
                    paymentMethod: selectedReceipt.payment_method,
                    vatableSale: selectedReceipt.vatable_sale,
                    vatAmount: selectedReceipt.vat_amount,
                    transaction_date: selectedReceipt.transaction_date,
                  };
                  console.log("Attempting to re-print receipt with data:", receiptDataToPrint);
                  onPrintReceipt(receiptDataToPrint);
                }}
                className="action-button primary-button"
              >
                <FaPrint /> Re-print Receipt
              </button>
            </div>
          </div>
        )
      ) : (
        <>
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-section">
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
                className="search-type-select"
              >
                <option value="all">All Fields</option>
                <option value="receipt">Receipt Number</option>
                <option value="customer">Customer Name</option>
                <option value="date">Date</option>
              </select>
              
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder={`Search by ${searchType === 'all' ? 'any field' : searchType}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="clear-search-button"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <div className="items-per-page">
              <label>Show:</label>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          {/* Results Summary */}
          <div className="results-summary">
            Showing {filteredReceipts.length === 0 ? 0 : indexOfFirstItem + 1} to{' '}
            {Math.min(indexOfLastItem, filteredReceipts.length)} of {filteredReceipts.length} receipts
            {searchTerm && ` (filtered from ${receipts.length} total)`}
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="receipts-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="text-right">Items (Count)</th>
                  <th className="text-right">Total Qty</th>
                  <th className="text-right">Gross Amount</th>
                  <th className="text-right">Net Pay</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentReceipts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-receipts-message">
                      {searchTerm ? 'No receipts found matching your search.' : 'No receipts found.'}
                    </td>
                  </tr>
                ) : (
                  currentReceipts.map((receipt) => {
                    const totalItemsCount = receipt.cart?.length || 0;
                    const totalQuantity = receipt.cart?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
                    const grossAmount = (parseFloat(receipt.total_price) || 0).toFixed(2);

                    return (
                      <tr key={receipt.id}>
                        <td>{receipt.receipt_number || receipt.id}</td>
                        <td>{new Date(receipt.transaction_date).toLocaleString()}</td>
                        <td>{receipt.customer_name || 'GUEST'}</td>
                        <td className="text-right">{totalItemsCount}</td>
                        <td className="text-right">{totalQuantity}</td>
                        <td className="text-right">{grossAmount}</td>
                        <td className="text-right">{parseFloat(receipt.net_pay).toFixed(2)}</td>
                        <td className="text-center">
                          <button
                            onClick={() => handleViewReceiptDetails(receipt.id)}
                            className="icon-button view-button"
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              
              <div className="pagination-numbers">
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showNotificationModal && (
        <NotificationModal
          message={notificationMessage}
          type={notificationType}
          onClose={handleCloseNotification}
        />
      )}

      <style jsx>{`
        .receipt-history-container {
          font-family: 'Arial', sans-serif;
          padding: 20px;
          max-width: 1500px;
          margin: 20px auto;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 2.5em;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }

        h3 {
          color: #555;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }

        .section-title {
          color: #555;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 1.3em;
        }

        .loading-message {
          text-align: center;
          padding: 20px;
          font-size: 1.2em;
          color: #3498db;
        }

        .error-container {
          text-align: center;
          padding: 20px;
          color: red;
          background-color: #ffe6e6;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        /* Search Bar Styles */
        .search-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-section {
          display: flex;
          gap: 10px;
          align-items: center;
          flex: 0 1 auto;
          max-width: 600px;
        }

        .search-type-select {
          padding: 12px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 0.95em;
          cursor: pointer;
          background-color: white;
          transition: border-color 0.3s ease;
          min-width: 150px;
        }

        .search-type-select:focus {
          outline: none;
          border-color: #167bb9;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          min-width: 250px;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 1.1em;
        }

        .search-input {
          width: 100%;
          padding: 12px 45px 12px 45px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1em;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #167bb9;
        }

        .clear-search-button {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          font-size: 1.2em;
          cursor: pointer;
          padding: 5px;
          transition: color 0.2s ease;
        }

        .clear-search-button:hover {
          color: #e74c3c;
        }

        .items-per-page {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95em;
          color: #555;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .items-per-page select {
          padding: 8px 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          transition: border-color 0.3s ease;
        }

        .items-per-page select:focus {
          outline: none;
          border-color: #167bb9;
        }

        .results-summary {
          text-align: center;
          color: #666;
          font-size: 0.95em;
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }

        /* Pagination Styles */
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 25px;
          flex-wrap: wrap;
        }

        .pagination-button {
          padding: 10px 20px;
          border: 2px solid #167bb9;
          background-color: white;
          color: #167bb9;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.95em;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .pagination-button:hover:not(:disabled) {
          background-color: #167bb9;
          color: white;
        }

        .pagination-button:disabled {
          border-color: #ddd;
          color: #ccc;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .pagination-number {
          min-width: 40px;
          height: 40px;
          padding: 8px;
          border: 2px solid #ddd;
          background-color: white;
          color: #555;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.95em;
          transition: all 0.3s ease;
        }

        .pagination-number:hover {
          border-color: #167bb9;
          color: #167bb9;
        }

        .pagination-number.active {
          background-color: #167bb9;
          color: white;
          border-color: #167bb9;
          font-weight: bold;
        }

        .pagination-ellipsis {
          padding: 8px;
          color: #999;
          font-size: 1.2em;
        }

        .receipt-details-card {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin-bottom: 25px;
        }

        .receipt-details-card p {
          margin-bottom: 8px;
          font-size: 1.05em;
          color: #333;
        }

        .receipt-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 15px;
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .receipt-items-table th,
        .receipt-items-table td {
          border: 1px solid #eee;
          padding: 12px;
          text-align: left;
          font-size: 0.95em;
        }

        .receipt-items-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          color: #333;
        }

        .receipt-items-table tr:nth-child(even) {
          background-color: #f8f8f8;
        }

        .receipt-items-table tr:hover {
          background-color: #f1f1f1;
        }

        .no-items-message, .no-receipts-message {
          text-align: center;
          padding: 20px;
          color: #777;
          font-style: italic;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .summary-line {
          text-align: right;
          margin-bottom: 5px;
          color: #333;
        }

        .total-line {
          font-weight: bold;
          font-size: 1.15em;
          margin-top: 15px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }

        .button-group {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          justify-content: flex-end;
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s ease;
        }

        .primary-button {
          background-color: #167bb9;
          color: white;
        }

        .primary-button:hover {
          background-color: #136a9e;
        }

        .secondary-button {
          background-color: #6c757d;
          color: white;
        }

        .secondary-button:hover {
          background-color: #5a6268;
        }

        .receipts-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .receipts-table th,
        .receipts-table td {
          border: 1px solid #eee;
          padding: 12px;
          text-align: left;
          font-size: 0.95em;
        }

        .receipts-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          color: #333;
        }

        .receipts-table tr:nth-child(even) {
          background-color: #f8f8f8;
        }

        .receipts-table tr:hover {
          background-color: #f1f1f1;
        }

        .table-responsive {
          overflow-x: auto;
          margin-top: 20px;
          background: #fff;
          border-radius: 8px;
          padding: 8px;
          max-height: calc(100vh - 300px);
        }

        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1em;
          margin: 0 5px;
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .icon-button.view-button {
          color: #167bb9;
        }

        .icon-button.view-button:hover {
          background-color: #e6f7ff;
        }

        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .custom-modal-content {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          text-align: center;
          width: 90%;
          max-width: 400px;
          color: #333;
        }

        .custom-modal-content p {
          margin-bottom: 20px;
          font-size: 1.1em;
        }

        .error-message-text {
          color: red;
        }

        .success-message-text {
          color: green;
        }

        .custom-modal-button {
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          transition: background-color 0.3s ease;
        }

        .custom-modal-button:hover {
          background-color: #0056b3;
        }

        @media (max-width: 768px) {
          .receipt-history-container {
            padding: 15px;
            margin: 10px auto;
          }

          .search-container {
            flex-direction: column;
            align-items: stretch;
          }

          .search-section {
            flex-direction: column;
            max-width: 100%;
            width: 100%;
          }

          .search-type-select {
            width: 100%;
          }

          .search-input-wrapper {
            min-width: 100%;
            max-width: 100%;
          }

          .items-per-page {
            justify-content: center;
            width: 100%;
          }

          .receipts-table th,
          .receipts-table td {
            padding: 8px;
            font-size: 0.9em;
          }

          .button-group {
            flex-direction: column;
            gap: 10px;
          }

          .action-button {
            width: 100%;
            justify-content: center;
          }

          .pagination-container {
            gap: 5px;
          }

          .pagination-button {
            padding: 8px 12px;
            font-size: 0.85em;
          }

          .pagination-number {
            min-width: 35px;
            height: 35px;
            font-size: 0.85em;
          }
        }
      `}</style>
    </div>
  );
}
