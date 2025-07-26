# Artwork Management System - Enhanced Workflow Guide

## Overview
The Enhanced Artwork Management System provides a comprehensive, step-wise workflow for managing artwork development from initial product creation to final vendor deliverables. The system includes proper stage management, vendor integration, document tracking, and approval workflows.

## Key Features

### 1. Step-by-Step Workflow Management
- **11 Defined Stages**: Complete workflow based on your activity table
- **Role-Based Access**: Different departments can only access relevant stages
- **SLA Tracking**: Monitor deadlines and escalations for each stage
- **Approval/Rejection Flow**: Proper approval process with rejection handling

### 2. Vendor Management Integration
- **Vendor Selection**: Integrated vendor selection modal
- **Vendor Dashboard**: Dedicated dashboard for vendor interactions
- **Document Submission**: Vendors can submit artwork, CDR, and packaging files
- **Progress Tracking**: Real-time tracking of vendor deliverables

### 3. Document Management
- **Centralized Storage**: All documents organized by product and stage
- **Version Control**: Track document versions and approvals
- **File Types**: Support for artwork, CDR, packaging, and technical files

## Workflow Stages

### Stage 1: CIB Copy Circulation
- **Department**: Regulatory
- **Responsible**: Ankur Prakash Verma/ Praful Bhamare
- **Task**: Cross-check product details (chemical name, MOC, packing requirements)
- **SLA**: Not Applicable

### Stage 2: Product Launch Tracker
- **Department**: Marketing
- **Responsible**: Product-wise CROP Managers
- **Task**: Ensure pack size and packing align with CIB copy
- **SLA**: 13 Working Days
- **Escalation**: Mahaveer Singh Rathore (14 days)

### Stage 3: Engineering Drawing/Specification
- **Department**: Quality
- **Responsible**: Gaurav Sakhare
- **Task**: Validate artwork dimensions and performance standards
- **SLA**: 
  - Existing dimensions: 2 Days
  - New Design: 7-10 Days (varies by type)
- **Escalation**: Aziz Hussain (7 days)

### Stage 4: Artwork Development
- **Department**: Marketing Services
- **Responsible**: Sanjeet Kumar
- **Task**: Develop artwork based on approved facia and CIB copy
- **SLA**: 15 Working Days
- **Escalation**: Mahaveer Singh Rathore (15 days)

### Stage 5: Artwork Approval - Regulatory
- **Department**: Regulatory
- **Responsible**: Ankur Prakash Verma
- **Task**: Check regulatory compliance per CIB guidelines
- **SLA**: 2 Working Days
- **Escalation**: Praful Bhamare (3 days)

### Stage 6: Artwork Approval - Legal
- **Department**: Legal
- **Responsible**: Bipin Thomas
- **Task**: Check legal compliance per Weights and Measures Act
- **SLA**: 2 Working Days
- **Escalation**: Amit Goel (3 days)

### Stage 7: Artwork Share to Vendor
- **Department**: Marketing Services
- **Responsible**: Sanjeet Kumar
- **Task**: Share approved artwork with vendor
- **SLA**: 2 Working Days
- **Escalation**: Mahaveer Singh Rathore (3 days)

### Stage 8: Supplier Selection & Development
- **Department**: SCM
- **Responsible**: Rajkumar Pandey
- **Task**: Coordinate vendor selection and material development
- **SLA**: 
  - Bottle/Cap: 120-130 Days
  - Pouch: 45 Days
  - Label/Leaflet: 14 Days
- **Escalation**: Vipul Patel (15 days)

### Stage 9: Vendor Artwork Approval
- **Department**: Marketing Services
- **Responsible**: Sanjeet Kumar
- **Task**: Verify vendor-submitted artwork
- **SLA**: 4 Working Days
- **Escalation**: Mahaveer Singh Rathore (4 days)

### Stage 10: Commercial PO Issuance
- **Department**: SCM
- **Responsible**: Rajkumar Pandey
- **Task**: Release purchase order
- **SLA**: 7 Working Days
- **Escalation**: Vipul Patel (7 days)

### Stage 11: Shade Card Review
- **Department**: Marketing Services
- **Responsible**: Sanjeet Kumar
- **Task**: Review hardcopy shade card from vendor
- **SLA**: 
  - Pouch/Monocarton: 30 Days
  - Labels/Leaflets: 20 Days
- **Escalation**: Mahaveer Singh Rathore (15 days)

## How to Use the System

### For Product Managers
1. **Create New Product**: Use the "Create New Product" button
2. **Enter Product Details**: Fill in all required product information
3. **Monitor Workflow**: Track progress through the workflow management tab
4. **Handle Approvals**: Approve or reject stages as needed

### For Department Users
1. **Access Assigned Stages**: Only stages relevant to your department are accessible
2. **Start Tasks**: Click "Start" to begin working on a stage
3. **Submit for Approval**: Use "Approve" when task is complete
4. **Handle Rejections**: Address feedback when stages are rejected

### For Vendors
1. **Receive Assignment**: Get notified when assigned to a product
2. **Access Vendor Dashboard**: View all assigned products and requirements
3. **Submit Documents**: Upload artwork, CDR, and packaging files
4. **Track Progress**: Monitor approval status and feedback

### For Approvers
1. **Review Submissions**: Access pending approvals through the workflow
2. **Approve/Reject**: Make decisions based on quality and compliance
3. **Provide Feedback**: Add comments for rejected items
4. **Track SLAs**: Monitor deadlines and escalations

## Vendor Selection Process

### When to Select Vendors
- Vendor selection typically happens at Stage 8 (Supplier Selection)
- Can also be triggered at Stage 9 (Vendor Artwork Approval)

### How to Select Vendors
1. **Click "Select Vendor"**: Available during relevant stages
2. **Filter by Category**: Choose appropriate packing material category
3. **Search Vendors**: Use search functionality to find specific vendors
4. **Review Details**: Check vendor contact information and capabilities
5. **Assign Vendor**: Select and assign vendor to the product
6. **Redirect to Dashboard**: System automatically opens vendor dashboard

### Vendor Dashboard Features
- **Product Overview**: See all assigned products
- **Progress Tracking**: Monitor submission status
- **File Upload**: Submit required documents
- **Deadline Management**: Track SLAs and deadlines
- **Communication**: View feedback and comments

## Document Management

### Document Categories
- **CIBRC Files**: Regulatory compliance documents
- **FAICA Files**: Facia approval documents
- **MOP Files**: Manner of packing documents
- **Artwork Files**: Design and artwork submissions
- **CDR Files**: CorelDRAW source files
- **Packaging Files**: Packaging specifications and samples

### File Organization
```
ArtworkLibrary/
├── CIBRC/
├── FAICA/
├── MOP/
└── VendorFiles/
    └── [VendorEmail]/
        └── [ProductName]/
            ├── Artwork/
            ├── CDR/
            └── Packaging/
```

## Best Practices

### For System Administrators
1. **Regular Monitoring**: Check workflow statistics daily
2. **SLA Management**: Monitor escalations and overdue items
3. **Vendor Management**: Keep vendor information updated
4. **Document Cleanup**: Regular cleanup of old/rejected files

### For Users
1. **Clear Communication**: Provide detailed feedback when rejecting items
2. **Timely Actions**: Complete tasks within SLA timeframes
3. **Document Quality**: Ensure all submissions meet quality standards
4. **Escalation Handling**: Address escalated items promptly

### For Vendors
1. **Regular Check-ins**: Monitor dashboard for new assignments
2. **Quality Submissions**: Ensure files meet specifications
3. **Timely Delivery**: Submit documents before deadlines
4. **Clear Communication**: Respond promptly to feedback

## Troubleshooting

### Common Issues
1. **Stage Not Progressing**: Check if all required documents are uploaded
2. **Vendor Not Assigned**: Ensure vendor selection was completed
3. **Files Not Uploading**: Check file format and size limits
4. **Permissions Error**: Contact system administrator for role assignments

### Support
For technical support or system issues, contact the IT helpdesk or system administrator.

## Future Enhancements
- Mobile app for vendor access
- Email notifications for stage updates
- Integration with ERP systems
- Advanced analytics and reporting
- Automated quality checks