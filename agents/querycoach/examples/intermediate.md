# Intermediate Examples

## Example 1: NULL Handling Issue

<schema>
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  manager_id INTEGER,  -- NULL for top-level employees
  salary INTEGER
);
</schema>

<question>Find all employees who don't report to manager #5</question>

<user_query>
SELECT name FROM employees WHERE manager_id != 5
</user_query>

<query_result>
name
----
Alice
Bob
Carol
</query_result>

<expected_result>
name
----
Alice
Bob
Carol
David    -- David has manager_id = NULL (top-level)
Eve      -- Eve has manager_id = NULL
</expected_result>

<user_level>intermediate</user_level>

### Assessment
Partially correct - this misses employees with NULL manager_id.

### What's Working
The logic is right for employees who *have* a manager. The WHERE clause correctly filters out manager #5.

### Issues Found
NULL represents "unknown" in SQL. When you compare `NULL != 5`, the result is NULL (unknown), not TRUE. So employees without managers get filtered out.

### Suggested Solution
```sql
SELECT name
FROM employees
WHERE manager_id != 5 OR manager_id IS NULL
```

Or more elegantly with COALESCE:

```sql
SELECT name
FROM employees
WHERE COALESCE(manager_id, -1) != 5
```

### Level Up

NULL is one of SQL's trickiest concepts. The rule: any comparison with NULL yields NULL (falsy). Always ask yourself: "What if this column is NULL?" Three-valued logic (TRUE, FALSE, NULL) catches even experienced developers.

-----

## Example 2: Inefficient Correlated Subquery

<schema>
CREATE TABLE orders (id INTEGER, customer_id INTEGER, amount DECIMAL, order_date DATE);
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, region TEXT);
</schema>

<question>Find customers whose total orders exceed $1000</question>

<user_query>
SELECT name
FROM customers
WHERE (SELECT SUM(amount) FROM orders WHERE orders.customer_id = customers.id) > 1000
</user_query>

<query_result>
name
----
Alice
Bob
</query_result>

<expected_result>
(matches)
</expected_result>

<user_level>intermediate</user_level>

### Assessment

Correct, but there's a more efficient approach.

### What's Working

The logic is sound - the correlated subquery correctly calculates each customer's total and filters appropriately.

### Issues Found

This correlated subquery runs once *per customer*. With 10,000 customers, that's 10,000 subquery executions. It works, but doesn't scale well.

### Suggested Solution

```sql
SELECT c.name
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
HAVING SUM(o.amount) > 1000
```

This processes the data in one pass with a JOIN + GROUP BY.

### Level Up

Correlated subqueries are powerful but often signal that a JOIN would be cleaner. Ask yourself: "Am I running this subquery repeatedly for each row?" If yes, consider restructuring. The query plan difference can be 100x on large datasets.
