-- Query to verify demo transaction
SELECT 
    o.id as order_id,
    o.merchant_id,
    o.amount,
    o.currency,
    o.status,
    o.receipt,
    o.notes,
    o.created_at,
    p.id as payment_id,
    p.method,
    p.status as payment_status
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.id LIKE 'order_demo%'
ORDER BY o.created_at DESC;
