/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-void */
import * as React from 'react';
import { Table, Button, notification } from 'antd';
import { sp } from '@pnp/sp/presets/all';

interface VendorSubmission {
    ID: number;
    ProductName: string;
    SupplierEmail: string;
    CDRFile: string;
    PackagingArtworkFile: string;
    Status: string;
    Remarks: string;
}

const VendorSubmissionsTab = (): JSX.Element => {
    const [vendorSubmissions, setVendorSubmissions] = React.useState<VendorSubmission[]>([]);

    const fetchVendorSubmissions = async (): Promise<void> => {
        try {
            const listName = 'Operational - Artwork Management Systems';
            const items = await sp.web.lists
                .getByTitle(listName)
                .items.select('ID, ProductName, SupplierEmail, CDRFile, PackagingArtworkFile, Status, Remarks')
                .get();
            setVendorSubmissions(items);
        } catch (error) {
            console.error('Error fetching vendor submissions:', error);
            notification.error({ message: 'Error', description: 'Failed to fetch vendor submissions.' });
        }
    };

    const handleApprove = async (id: number): Promise<void> => {
        try {
            const listName = 'Operational - Artwork Management Systems';
            await sp.web.lists.getByTitle(listName).items.getById(id).update({
                Status: 'Sent to SCM', // Update the status
                RunWF: 'YES', // Set RunWF to "YES"
            });
            notification.success({ message: 'Success', description: 'Submission approved and status updated to "Sent to SCM".' });
            void fetchVendorSubmissions();
        } catch (error) {
            console.error('Error approving submission:', error);
            notification.error({ message: 'Error', description: 'Failed to approve submission.' });
        }
    };

    const handleReject = async (id: number): Promise<void> => {
        try {
            const listName = 'Operational - Artwork Management Systems';
            await sp.web.lists.getByTitle(listName).items.getById(id).update({ Status: 'Rejected' });
            notification.success({ message: 'Success', description: 'Submission rejected.' });
            void fetchVendorSubmissions();
        } catch (error) {
            console.error('Error rejecting submission:', error);
            notification.error({ message: 'Error', description: 'Failed to reject submission.' });
        }
    };

    React.useEffect(() => {
        void fetchVendorSubmissions();
    }, []);

    const columns = [
        { title: 'Product Name', dataIndex: 'ProductName', key: 'ProductName' },
        { title: 'Supplier Email', dataIndex: 'SupplierEmail', key: 'SupplierEmail' },
        { title: 'CDR File', dataIndex: 'CDRFile', key: 'CDRFile' },
        { title: 'Packaging Artwork File', dataIndex: 'PackagingArtworkFile', key: 'PackagingArtworkFile' },
        { title: 'Status', dataIndex: 'Status', key: 'Status' },
        { title: 'Remarks', dataIndex: 'Remarks', key: 'Remarks' },
        {
            title: 'Actions',
            key: 'Actions',
            render: (_: any, record: { ID: number; }) => (
                <>
                    <Button onClick={() => handleApprove(record.ID)}>Approve</Button>
                    <Button onClick={() => handleReject(record.ID)} style={{ marginLeft: 8 }}>
                        Reject
                    </Button>
                </>
            ),
        },
    ];

    return <Table dataSource={vendorSubmissions} columns={columns} rowKey="ID" />;
};

export default VendorSubmissionsTab;
