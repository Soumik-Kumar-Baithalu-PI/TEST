/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Steps, Card, Tag, Button, Table, Progress, notification, Row, Col, Statistic } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined, FileOutlined } from '@ant-design/icons';
import * as moment from 'moment';
import styles from './WorkflowStages.module.scss';

const { Step } = Steps;

export interface WorkflowStage {
  id: number;
  activity: string;
  taskDescription: string;
  department: string;
  fpr: string;
  slaToComplete: string;
  firstEscalation: string;
  reminderNotification: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected' | 'Escalated';
  startDate?: Date;
  completedDate?: Date;
  documents?: any[];
  vendorEmail?: string;
}

export const workflowStages: WorkflowStage[] = [
  {
    id: 1,
    activity: "CIB copy circulate to All Stakeholder",
    taskDescription: "Cross-check product details such as chemical name, MOC (Material of Construction), and manner of packing as per requirement",
    department: "Regulatory",
    fpr: "Ankur Prakash Verma/ Praful Bhamare",
    slaToComplete: "NA",
    firstEscalation: "NA",
    reminderNotification: "NA",
    status: 'Pending'
  },
  {
    id: 2,
    activity: "Product Launch Tracker: Facia/MOP/FG CODE/BOM",
    taskDescription: "Ensure pack size and manner of packing align with the details in the CIB copy",
    department: "Marketing",
    fpr: "Product-wise CROP Managers",
    slaToComplete: "13 Working Days",
    firstEscalation: "Mahaveer Singh Rathore",
    reminderNotification: "14 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 3,
    activity: "Eng. Drawing/Specification",
    taskDescription: "Validate artwork dimensions and performance as per existing standards, including machinability, batch coding feasibility, and dimensional accuracy",
    department: "Quality",
    fpr: "Gaurav Sakhare",
    slaToComplete: "For validation of drawing (KLD) with existing dimensions: 2 Days. For New Design: 1. Pouch: 7-10 Days after availability of material to be filled. 2. Mono-Carton: 3-5 days for Draft specification for trial sample & Final KLD will be provided 2-3 days after receipt of trial sample. 3. Bottle Label, Shipper Label, Leaflet: 2 Days (Standard dimensions)",
    firstEscalation: "Aziz Hussain",
    reminderNotification: "7 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 4,
    activity: "Artwork Development",
    taskDescription: "Develop artwork based on the approved facia and CIB copy",
    department: "Marketing Services",
    fpr: "Sanjeet Kumar",
    slaToComplete: "15 Working Days",
    firstEscalation: "Mahaveer Singh Rathore",
    reminderNotification: "15 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 5,
    activity: "Artwork Approval - Regulatory",
    taskDescription: "Check regulatory compliance of artwork as per CIB guidelines",
    department: "Regulatory",
    fpr: "Ankur Prakash Verma",
    slaToComplete: "2 Working Days",
    firstEscalation: "Praful Bhamare",
    reminderNotification: "3 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 6,
    activity: "Artwork Approval - Legal",
    taskDescription: "Check legal compliance as per Weights and Measures Act",
    department: "Legal",
    fpr: "Bipin Thomas",
    slaToComplete: "2 Working Days",
    firstEscalation: "Amit Goel",
    reminderNotification: "3 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 7,
    activity: "Artwork share to vendor by Link/CDR",
    taskDescription: "Share the approved artwork with the vendor, ensuring alignment with facia and CIB copy",
    department: "Marketing Services",
    fpr: "Sanjeet Kumar",
    slaToComplete: "2 Working Days",
    firstEscalation: "Mahaveer Singh Rathore",
    reminderNotification: "3 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 8,
    activity: "Development of packing material/Supplier selection",
    taskDescription: "Coordinate with Marketing Services, Quality, and Vendors to ensure timely development and supply of packing material",
    department: "SCM",
    fpr: "Rajkumar Pandey",
    slaToComplete: "Bottle and Cap: 120-130 Days (New Mould), Pouch: 45 Days, Label, leaflet, Shipper box: 14 Days",
    firstEscalation: "Vipul Patel",
    reminderNotification: "15 Working Days of task initiation",
    status: 'Pending'
  },
  {
    id: 9,
    activity: "Approval of Artwork file send by Vendor",
    taskDescription: "Verify vendor-submitted artwork against the approved facia and CIB copy",
    department: "Marketing Services",
    fpr: "Sanjeet Kumar",
    slaToComplete: "4 Working Days",
    firstEscalation: "Mahaveer Singh Rathore",
    reminderNotification: "4 Working Days after task initiation",
    status: 'Pending'
  },
  {
    id: 10,
    activity: "Commercial Supply Issuing PO to supplier",
    taskDescription: "Release the purchase order based on approved artwork and technical specifications",
    department: "SCM",
    fpr: "Rajkumar Pandey",
    slaToComplete: "7 Working Days",
    firstEscalation: "Vipul Patel",
    reminderNotification: "7 Working Days of task initiation",
    status: 'Pending'
  },
  {
    id: 11,
    activity: "Shade card",
    taskDescription: "Review hardcopy of the shade card shared by the vendor to ensure it matches the approved artwork and color standards",
    department: "Marketing Services",
    fpr: "Sanjeet Kumar",
    slaToComplete: "30 Days for Pouch and Monocarton, 20 Days for label, leaflet and shipper label and shipper box",
    firstEscalation: "Mahaveer Singh Rathore",
    reminderNotification: "15 Working Days after task initiation",
    status: 'Pending'
  }
];

interface WorkflowStagesProps {
  productId: number;
  currentStage: number;
  stages: WorkflowStage[];
  onStageUpdate: (stageId: number, status: string, data?: any) => void;
  onVendorSelect: (vendorEmail: string, productId: number) => void;
  userRole: string;
}

const WorkflowStages: React.FC<WorkflowStagesProps> = ({
  productId,
  currentStage,
  stages,
  onStageUpdate,
  onVendorSelect,
  userRole
}) => {
  const calculateSLAProgress = (stage: WorkflowStage): number => {
    if (!stage.startDate || stage.status === 'Completed') return 100;
    
    const startDate = moment(stage.startDate);
    const currentDate = moment();
    const slaText = stage.slaToComplete;
    
    // Extract days from SLA text
    const daysMatch = slaText.match(/(\d+)\s*(?:Working\s*)?Days?/i);
    if (!daysMatch) return 0;
    
    const slaDays = parseInt(daysMatch[1]);
    const daysPassed = currentDate.diff(startDate, 'days');
    const progress = Math.min((daysPassed / slaDays) * 100, 100);
    
    return progress;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed': return 'green';
      case 'In Progress': return 'blue';
      case 'Rejected': return 'red';
      case 'Escalated': return 'orange';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'Completed': return <CheckCircleOutlined />;
      case 'In Progress': return <ClockCircleOutlined />;
      case 'Rejected': return <ExclamationCircleOutlined />;
      case 'Escalated': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const handleStageAction = (stageId: number, action: 'approve' | 'reject' | 'start') => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    switch (action) {
      case 'start':
        onStageUpdate(stageId, 'In Progress', { startDate: new Date() });
        break;
      case 'approve':
        onStageUpdate(stageId, 'Completed', { completedDate: new Date() });
        notification.success({
          message: 'Stage Approved',
          description: `${stage.activity} has been approved and completed.`
        });
        break;
      case 'reject':
        onStageUpdate(stageId, 'Rejected');
        notification.warning({
          message: 'Stage Rejected',
          description: `${stage.activity} has been rejected. The workflow will move to the previous stage.`
        });
        break;
    }
  };

  const canUserActOnStage = (stage: WorkflowStage): boolean => {
    // Check if user role matches the department or if they are an approver
    return stage.department.toLowerCase().includes(userRole.toLowerCase()) ||
           stage.fpr.toLowerCase().includes(userRole.toLowerCase()) ||
           userRole === 'Owner' || userRole === 'Admin';
  };

  const vendorSelectionStages = [8, 9]; // Stages that require vendor selection

  const stageColumns = [
    {
      title: 'Stage',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      width: 200,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: 'Responsible Person',
      dataIndex: 'fpr',
      key: 'fpr',
      width: 150,
    },
    {
      title: 'SLA',
      dataIndex: 'slaToComplete',
      key: 'slaToComplete',
      width: 150,
      render: (sla: string, record: WorkflowStage) => (
        <div>
          <div>{sla}</div>
          {record.status === 'In Progress' && (
            <Progress 
              percent={calculateSLAProgress(record)} 
              size="small"
              status={calculateSLAProgress(record) > 90 ? 'exception' : 'active'}
            />
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: WorkflowStage) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {record.status === 'Pending' && record.id === currentStage && canUserActOnStage(record) && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleStageAction(record.id, 'start')}
            >
              Start
            </Button>
          )}
          
          {record.status === 'In Progress' && canUserActOnStage(record) && (
            <>
              <Button 
                size="small" 
                type="primary"
                onClick={() => handleStageAction(record.id, 'approve')}
              >
                Approve
              </Button>
              <Button 
                size="small" 
                danger
                onClick={() => handleStageAction(record.id, 'reject')}
              >
                Reject
              </Button>
            </>
          )}

          {vendorSelectionStages.includes(record.id) && record.status === 'In Progress' && (
            <Button 
              size="small" 
              type="default"
              onClick={() => {
                // This would typically open a vendor selection modal
                // For now, we'll use a placeholder vendor email
                const vendorEmail = 'vendor@example.com'; // This should come from vendor selection
                onVendorSelect(vendorEmail, productId);
              }}
            >
              Select Vendor
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Calculate workflow statistics
  const completedStages = stages.filter(s => s.status === 'Completed').length;
  const pendingStages = stages.filter(s => s.status === 'Pending').length;
  const rejectedStages = stages.filter(s => s.status === 'Rejected').length;
  const inProgressStages = stages.filter(s => s.status === 'In Progress').length;

  return (
    <div className={styles.workflowContainer}>
      {/* Workflow Statistics */}
      <div className={styles.workflowStats}>
        <Card className={`${styles.statCard} ${styles.completedStat}`}>
          <Statistic
            title="Completed Stages"
            value={completedStages}
            prefix={<CheckCircleOutlined className={styles.statIcon} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        <Card className={`${styles.statCard} ${styles.inProgressStat}`}>
          <Statistic
            title="In Progress"
            value={inProgressStages}
            prefix={<ClockCircleOutlined className={styles.statIcon} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card className={`${styles.statCard} ${styles.pendingStat}`}>
          <Statistic
            title="Pending Stages"
            value={pendingStages}
            prefix={<ExclamationCircleOutlined className={styles.statIcon} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
        <Card className={`${styles.statCard} ${styles.rejectedStat}`}>
          <Statistic
            title="Rejected Stages"
            value={rejectedStages}
            prefix={<WarningOutlined className={styles.statIcon} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </div>

      <Card className={styles.workflowCard}>
        <div className={styles.workflowHeader}>
          Artwork Management Workflow - Step-by-Step Process
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className={styles.stageProgress}>
            <Steps 
              current={currentStage - 1} 
              direction="horizontal" 
              size="small"
            >
              {stages.slice(0, 6).map((stage) => (
                <Step 
                  key={stage.id}
                  title={`Stage ${stage.id}`}
                  description={stage.department}
                  status={
                    stage.status === 'Completed' ? 'finish' :
                    stage.status === 'Rejected' ? 'error' :
                    stage.id === currentStage ? 'process' : 'wait'
                  }
                  icon={getStatusIcon(stage.status)}
                />
              ))}
            </Steps>
          </div>
          
          <Table
            dataSource={stages}
            columns={stageColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
            size="small"
            rowClassName={(record) => 
              record.id === currentStage ? styles.currentStageRow : ''
            }
          />
        </div>
      </Card>
    </div>
  );
};

export default WorkflowStages;