# Импорт данных

## Purpose
This Timetta component enables importing initial system data. Based on these inputs, the system automatically populates directories, sets parameters for entities, and configures components.

## Access Requirements
The component is accessible in the **Settings** area only to users with the **Administrator** role and active "Tenant Management" permissions.

## Import Instructions

To execute an import:

1. Navigate to the Data Import component
2. Click the **Import Data** button on the action panel
3. Download the current Excel import template
4. Complete the template and save
5. Click **Select** to locate your file or drag it into the window (25 MB maximum)
6. Click **Import**

The import card will open and display status progression from "Importing" to "Imported" when complete. Imported entities will be listed below. Any rows containing errors are skipped by the importer.

**Important:** Import continues while column B contains data. Data import is irreversible—manually remove imported content if needed.

## Supported Components and Directories

The import mechanism can populate these Timetta elements:

| Component | Template Sheet |
|-----------|---|
| Absence Types | `TimeOffTypes` |
| Financial Accounts | `FinancialAccounts` |
| Currencies | `Currencies` |
| Exchange Rates | `ExchangeRates` |
| Departments | `Departments` |
| Roles | `Roles` |
| Resource Pools | `ResourcePools` |
| Levels | `Levels` |
| Grades | `Grades` |
| Locations | `Locations` |
| User Groups | `Groups` |
| Users | `Users` |
| User Cost | `UserCost` |
| Clients | `Clients` |
| Programs | `Programs` |
| Projects | `Projects` |
| Project Tasks | `Tasks` |
| Expense Estimates | `ExpenseEstimates` |
| Revenue Estimates | `RevenueEstimates` |
| Work Types | `Activities` |
| Time Entries | `ActualData` |
| Actual Expenses | `ActualExpenses` |
