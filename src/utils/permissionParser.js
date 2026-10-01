/**
 * RBAC Permission Parser & Utility Functions
 * Parses flat colon-separated permission strings into categorized hierarchy.
 */

export const SYSTEM_PERMISSIONS_CATALOG = [
  {
    "action_name": "admin:roles:manage",
    "description": "Create, update, and delete admin roles and assign permission sets"
  },
  {
    "action_name": "admin:roles:read",
    "description": "View admin role taxonomy and permission matrix"
  },
  {
    "action_name": "admin:scopes:manage",
    "description": "Assign and update entity-specific admin scopes (School, Category, Retailer, All)"
  },
  {
    "action_name": "admin:scopes:read",
    "description": "View admin entity scoping constraints"
  },
  {
    "action_name": "approvals:cash_remittances:manage",
    "description": "Approve and reconcile cash remittances deposited at hubs/bank"
  },
  {
    "action_name": "approvals:cash_remittances:read",
    "description": "View pending cash collection remittances from delivery partners"
  },
  {
    "action_name": "approvals:delivery_partners:manage",
    "description": "Approve delivery partners, set COD eligibility, issue PIN, or reject"
  },
  {
    "action_name": "approvals:delivery_partners:read",
    "description": "View pending delivery partner applications with KYC documents"
  },
  {
    "action_name": "approvals:products:manage",
    "description": "Approve products with delivery fees, commissions & payment methods, or reject"
  },
  {
    "action_name": "approvals:products:read",
    "description": "View pending product listings submitted by retailers"
  },
  {
    "action_name": "approvals:retailers:manage",
    "description": "Approve retailer accounts or reject applications"
  },
  {
    "action_name": "approvals:retailers:read",
    "description": "View pending retailer registration applications"
  },
  {
    "action_name": "approvals:school_retailers:manage",
    "description": "Approve or reject retailer requests to sell products for specific schools"
  },
  {
    "action_name": "approvals:school_retailers:read",
    "description": "View pending retailer-school access requests"
  },
  {
    "action_name": "banners:manage",
    "description": "Create, edit, reorder, and delete promotional banner campaigns"
  },
  {
    "action_name": "banners:read",
    "description": "View promotional banners, ordering, and active display periods"
  },
  {
    "action_name": "brands:manage",
    "description": "Create, edit, and delete brands"
  },
  {
    "action_name": "brands:read",
    "description": "View brand directory and brand details"
  },
  {
    "action_name": "categories:manage",
    "description": "Create, update, delete categories and upload icon assets"
  },
  {
    "action_name": "categories:read",
    "description": "View categories list, tree hierarchy, and details"
  },
  {
    "action_name": "delivery_partners:bank_details:manage",
    "description": "Add and verify delivery partner bank accounts via penny-drop"
  },
  {
    "action_name": "delivery_partners:bank_details:read",
    "description": "View delivery partner bank accounts"
  },
  {
    "action_name": "delivery_partners:ledger:manage",
    "description": "Initiate payouts and adjust delivery partner wallet balances"
  },
  {
    "action_name": "delivery_partners:ledger:read",
    "description": "Inspect delivery partner financial ledger, transactions, and running balances"
  },
  {
    "action_name": "delivery_partners:manage",
    "description": "Update partner profile, vehicle registration, toggle COD eligibility, and force un-assign orders"
  },
  {
    "action_name": "delivery_partners:read",
    "description": "View delivery partner fleet, KYC docs, loadouts, SLA timers, and delivery history"
  },
  {
    "action_name": "media:manage",
    "description": "Upload, replace, and permanently remove images and media assets"
  },
  {
    "action_name": "media:read",
    "description": "View and retrieve uploaded digital assets and document scans"
  },
  {
    "action_name": "notifications:manage",
    "description": "Broadcast system notifications and manage message states"
  },
  {
    "action_name": "notifications:read",
    "description": "View administrative and operational notifications"
  },
  {
    "action_name": "orders:cancellations:manage",
    "description": "Cancel orders or specific order items with refund triggers"
  },
  {
    "action_name": "orders:cancellations:read",
    "description": "View cancelled orders and audit cancellation logs"
  },
  {
    "action_name": "orders:export:manage",
    "description": "Export order reports and fulfillment summaries to CSV/Excel"
  },
  {
    "action_name": "orders:manage",
    "description": "Update order/item lifecycle statuses, payment statuses, and bulk update orders"
  },
  {
    "action_name": "orders:read",
    "description": "Search orders, view detailed items, dispatch IDs, timelines, tracking, and analytics"
  },
  {
    "action_name": "orders:returns:manage",
    "description": "Approve/reject customer returns and assign return pickup tasks to delivery partners"
  },
  {
    "action_name": "orders:returns:read",
    "description": "View customer return requests, statuses, and return pickups"
  },
  {
    "action_name": "orders:warehouse:manage",
    "description": "Pack, ship, and update status of warehouse-specific order items"
  },
  {
    "action_name": "orders:warehouse:read",
    "description": "View active order items assigned to specific warehouse queues"
  },
  {
    "action_name": "pincodes:manage",
    "description": "Bulk import and update serviceable pincode zones and SLAs"
  },
  {
    "action_name": "pincodes:read",
    "description": "Check pincode delivery coverage and estimated timelines"
  },
  {
    "action_name": "products:addons:manage",
    "description": "Attach or detach upsell add-on accessories to product variants"
  },
  {
    "action_name": "products:addons:read",
    "description": "View add-on and accessory products linked to variants"
  },
  {
    "action_name": "products:commissions:manage",
    "description": "Configure percentage or flat commission rates per variant"
  },
  {
    "action_name": "products:commissions:read",
    "description": "View variant commission structures and platform take-rates"
  },
  {
    "action_name": "products:general:manage",
    "description": "Create, edit, and manage general store products"
  },
  {
    "action_name": "products:general:read",
    "description": "View general consumer store products"
  },
  {
    "action_name": "products:images:manage",
    "description": "Upload, bulk upload, reorder, delete, and set primary cover images"
  },
  {
    "action_name": "products:images:read",
    "description": "View product and variant gallery images"
  },
  {
    "action_name": "products:manage",
    "description": "Create, atomically update, activate, deactivate, delete, and bulk update products"
  },
  {
    "action_name": "products:options:manage",
    "description": "Add, modify, and delete product attribute options and custom values"
  },
  {
    "action_name": "products:options:read",
    "description": "View product attribute option types and values"
  },
  {
    "action_name": "products:read",
    "description": "Search, filter, view all catalog products, analytics, and availability"
  },
  {
    "action_name": "products:school:manage",
    "description": "Create, edit, and manage school product kits"
  },
  {
    "action_name": "products:school:read",
    "description": "View school-specific catalog products (booksets, uniforms, stationery)"
  },
  {
    "action_name": "products:variants:manage",
    "description": "Create, update, delete variants, and manage live stock quantities"
  },
  {
    "action_name": "products:variants:read",
    "description": "Search and inspect product variants, SKU options, and stock"
  },
  {
    "action_name": "retailers:bank_accounts:manage",
    "description": "Add, penny-drop verify, set primary, and delete retailer bank accounts"
  },
  {
    "action_name": "retailers:bank_accounts:read",
    "description": "View retailer payout bank account details"
  },
  {
    "action_name": "retailers:manage",
    "description": "Create, update retailer business details, GSTIN, PAN, signatures, and email/phone credentials"
  },
  {
    "action_name": "retailers:read",
    "description": "View retailer profiles, KYC details, metrics, and verification statuses"
  },
  {
    "action_name": "retailers:schools:manage",
    "description": "Request, authorize, configure product categories, or unlink retailer-school partnerships"
  },
  {
    "action_name": "retailers:schools:read",
    "description": "View schools linked to retailers and connection statuses (approved, pending, rejected)"
  },
  {
    "action_name": "retailers:settlements:manage",
    "description": "Request payouts and reconcile retailer ledger entries"
  },
  {
    "action_name": "retailers:settlements:read",
    "description": "View retailer ledgers, balance breakdown, and settlement receipts"
  },
  {
    "action_name": "retailers:warehouses:manage",
    "description": "Create, update geolocation, and delete retailer warehouse facilities"
  },
  {
    "action_name": "retailers:warehouses:read",
    "description": "View warehouses associated with retailers and stock locations"
  },
  {
    "action_name": "schools:manage",
    "description": "Create, edit, deactivate, reactivate schools, and bulk import CSV"
  },
  {
    "action_name": "schools:partnerships:manage",
    "description": "Create, modify, and track school official partnerships"
  },
  {
    "action_name": "schools:products:manage",
    "description": "Tag or dissociate products with schools, configure grades and mandatory status"
  },
  {
    "action_name": "schools:read",
    "description": "View school profiles, directory, analytics, and catalog"
  },
  {
    "action_name": "schools:sort_order:manage",
    "description": "Update school sort orders and homepage positioning"
  },
  {
    "action_name": "schools:sort_order:read",
    "description": "View school sort order precedence on storefront"
  },
  {
    "action_name": "settlements:manage",
    "description": "Execute automated FIFO bank payouts and post manual financial ledger adjustments"
  },
  {
    "action_name": "settlements:read",
    "description": "View global due settlements, unpaid ledgers, retailer financial summaries, and payout history"
  },
  {
    "action_name": "support:queries:manage",
    "description": "Post admin replies to support tickets and resolve/close customer queries"
  },
  {
    "action_name": "support:queries:read",
    "description": "View customer order query tickets, threads, and dispatch metadata"
  },
  {
    "action_name": "users:export:manage",
    "description": "Export user databases for compliance and analytics"
  },
  {
    "action_name": "users:manage",
    "description": "Update user profiles, assign roles, deactivate, and reactivate accounts"
  },
  {
    "action_name": "users:read",
    "description": "Search and inspect user accounts, stats, and activity histories"
  },
  {
    "action_name": "warehouses:manage",
    "description": "Create, update, and manage global supply warehouse hubs"
  },
  {
    "action_name": "warehouses:read",
    "description": "View all global warehouses, inventory levels, and low-stock telemetry"
  }
];


/**
 * Formats a resource key string into a clean UI category title.
 * e.g., 'schools' -> 'Schools', 'delivery_partners' -> 'Delivery Partners'
 */
export const formatResourceName = (resourceKey) => {
  if (!resourceKey) return "General";
  return resourceKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Formats an action suffix into a human-readable title.
 * e.g., 'manage' -> 'Full Manage', 'sort_order:manage' -> 'Manage Sort Order'
 */
export const formatActionName = (actionKey) => {
  if (!actionKey) return "";
  const parts = actionKey.split(":");
  const mainAction = parts[parts.length - 1];
  const subResource = parts.slice(0, -1).join(" ");

  const actionVerb =
    mainAction === "manage"
      ? "Manage"
      : mainAction === "read"
      ? "View"
      : mainAction.charAt(0).toUpperCase() + mainAction.slice(1);

  if (subResource) {
    const formattedSub = subResource
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `${actionVerb} ${formattedSub}`;
  }

  return actionVerb;
};

/**
 * Dynamically groups a flat list of permission strings (or objects) by their prefix.
 *
 * @param {Array<string|{ action_name: string, description?: string }>} permissionsList
 * @returns {Record<string, { categoryKey: string, categoryLabel: string, permissions: Array<{ id: string, action_name: string, resource: string, action: string, label: string, description: string }> }>}
 */
export const parseAndGroupPermissions = (permissionsList = SYSTEM_PERMISSIONS_CATALOG) => {
  const groups = {};

  permissionsList.forEach((item) => {
    const actionStr = typeof item === "string" ? item : item.action_name;
    const description = typeof item === "object" ? item.description : "";
    if (!actionStr) return;

    const firstColonIdx = actionStr.indexOf(":");
    let resourceKey = "general";
    let actionKey = actionStr;

    if (firstColonIdx !== -1) {
      resourceKey = actionStr.substring(0, firstColonIdx);
      actionKey = actionStr.substring(firstColonIdx + 1);
    }

    if (!groups[resourceKey]) {
      groups[resourceKey] = {
        categoryKey: resourceKey,
        categoryLabel: formatResourceName(resourceKey),
        permissions: [],
      };
    }

    groups[resourceKey].permissions.push({
      id: actionStr,
      action_name: actionStr,
      resource: resourceKey,
      action: actionKey,
      label: formatActionName(actionKey),
      description:
        description ||
        `Allows ${actionKey.replace(/:/g, " ")} operations on ${formatResourceName(
          resourceKey
        ).toLowerCase()}`,
    });
  });

  return groups;
};
