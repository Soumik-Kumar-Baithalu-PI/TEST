/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Modal, Table, Button, Input, Select, notification, Divider, Card } from 'antd';
import { SearchOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { sp } from '@pnp/sp/presets/all';

const { Option } = Select;
const { Search } = Input;

interface Vendor {
  ID: number;
  SupplierName: string;
  Supplier: string;
  SupplierEmail: string;
  PackingMaterialCategory: string;
  ContactPerson: string;
  PhoneNumber: string;
  Address: string;
  Rating?: number;
  LastOrderDate?: string;
}

interface VendorSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onVendorSelect: (vendor: Vendor, productId: number) => void;
  productId: number;
  packingMaterialCategory?: string;
}

const VendorSelectionModal: React.FC<VendorSelectionModalProps> = ({
  visible,
  onClose,
  onVendorSelect,
  productId,
  packingMaterialCategory
}) => {
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState(packingMaterialCategory || '');

  const packingCategories = [
    "BOP TAPE",
    "LABEL",
    "LDPE SHRINK",
    "LEAFLET",
    "MONOCARTON",
    "NECK TIE",
    "POUCH",
    "SHIPPER BOX",
    "SHIPPER LABEL",
  ];

  React.useEffect(() => {
    if (visible) {
      fetchVendors();
    }
  }, [visible]);

  React.useEffect(() => {
    applyFilters();
  }, [vendors, searchTerm, categoryFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const listName = 'Vendor List';
      const items = await sp.web.lists
        .getByTitle(listName)
        .items.select(
          'ID', 
          'SupplierName', 
          'Supplier', 
          'SupplierEmail', 
          'PackingMaterialCategory',
          'ContactPerson',
          'PhoneNumber',
          'Address'
        )
        .get();
      
      setVendors(items);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch vendor list. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = vendors;

    if (categoryFilter) {
      filtered = filtered.filter(vendor => 
        vendor.PackingMaterialCategory === categoryFilter
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.SupplierName?.toLowerCase().includes(term) ||
        vendor.Supplier?.toLowerCase().includes(term) ||
        vendor.SupplierEmail?.toLowerCase().includes(term) ||
        vendor.ContactPerson?.toLowerCase().includes(term)
      );
    }

    setFilteredVendors(filtered);
  };

  const handleVendorSelection = () => {
    if (!selectedVendor) {
      notification.warning({
        message: 'No Vendor Selected',
        description: 'Please select a vendor to proceed.',
      });
      return;
    }

    // Update the product with vendor information
    updateProductVendor(selectedVendor);
    
    // Call the parent callback
    onVendorSelect(selectedVendor, productId);
    
    // Close modal
    onClose();
    
    // Navigate to vendor dashboard
    navigateToVendorDashboard(selectedVendor.SupplierEmail);
  };

  const updateProductVendor = async (vendor: Vendor) => {
    try {
      await sp.web.lists
        .getByTitle('Operational - Artwork Management Systems')
        .items.getById(productId)
        .update({
          AssignedVendor: vendor.SupplierName,
          VendorEmail: vendor.SupplierEmail,
          VendorCategory: vendor.PackingMaterialCategory,
          VendorAssignedDate: new Date().toISOString(),
        });
      
      notification.success({
        message: 'Vendor Assigned',
        description: `${vendor.SupplierName} has been assigned to this product.`,
      });
    } catch (error) {
      console.error('Error updating product vendor:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to assign vendor to product.',
      });
    }
  };

  const navigateToVendorDashboard = (vendorEmail: string) => {
    // This would typically use React Router or similar
    // For now, we'll show a notification
    notification.info({
      message: 'Redirecting to Vendor Dashboard',
      description: `Opening vendor dashboard for ${vendorEmail}`,
    });
    
    // In a real application, you might do:
    // history.push(`/vendor-dashboard/${vendorEmail}`);
    // or window.location.href = `/vendor-dashboard?email=${vendorEmail}`;
  };

  const vendorColumns = [
    {
      title: 'Supplier Name',
      dataIndex: 'SupplierName',
      key: 'SupplierName',
      render: (text: string, record: Vendor) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.Supplier}</div>
        </div>
      ),
    },
    {
      title: 'Contact Information',
      key: 'contact',
      render: (_: any, record: Vendor) => (
        <div>
          <div><UserOutlined /> {record.ContactPerson}</div>
          <div><MailOutlined /> {record.SupplierEmail}</div>
          <div>{record.PhoneNumber}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'PackingMaterialCategory',
      key: 'PackingMaterialCategory',
    },
    {
      title: 'Address',
      dataIndex: 'Address',
      key: 'Address',
      ellipsis: true,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Vendor) => (
        <Button
          type={selectedVendor?.ID === record.ID ? 'primary' : 'default'}
          onClick={() => setSelectedVendor(record)}
        >
          {selectedVendor?.ID === record.ID ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="Select Vendor for Product"
      visible={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="assign"
          type="primary"
          onClick={handleVendorSelection}
          disabled={!selectedVendor}
        >
          Assign Vendor & Open Dashboard
        </Button>,
      ]}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Search
              placeholder="Search vendors by name, email, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </div>
          <div style={{ minWidth: 200 }}>
            <Select
              placeholder="Filter by packing category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {packingCategories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {selectedVendor && (
        <Card 
          size="small" 
          title="Selected Vendor" 
          style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {selectedVendor.SupplierName}
              </div>
              <div>{selectedVendor.SupplierEmail}</div>
              <div>{selectedVendor.PackingMaterialCategory}</div>
            </div>
            <Button onClick={() => setSelectedVendor(null)}>
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      <Divider />

      <Table
        dataSource={filteredVendors}
        columns={vendorColumns}
        rowKey="ID"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ y: 400 }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedVendor ? [selectedVendor.ID] : [],
          onSelect: (record) => setSelectedVendor(record),
        }}
      />
    </Modal>
  );
};

export default VendorSelectionModal;