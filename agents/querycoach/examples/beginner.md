# Beginner Examples

## Example 1: Cartesian Product (Missing JOIN Condition)

<schema>
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount DECIMAL, order_date DATE);
-- Sample: 3 users, 5 orders
</schema>

<question>Find the total amount spent by each user</question>

<user_query>
SELECT users.name, SUM(orders.amount)
FROM users, orders
GROUP BY users.name
</user_query>

<query_result>
name    | SUM(orders.amount)
--------|-------------------
Alice   | 2500.00
Bob     | 2500.00
Carol   | 2500.00
</query_result>

<expected_result>
name    | total
--------|-------
Alice   | 850.00
Bob     | 1200.00
Carol   | 450.00
</expected_result>

<user_level>beginner</user_level>

### Assessment
Incorrect - the query creates a "cartesian product" where every user gets paired with every order.

### What's Working
Good instincts here! You correctly used SUM() to total the amounts, GROUP BY to get per-user results, and selected from both tables you need.

### Issues Found
When you write `FROM users, orders` without telling SQL how to connect them, it matches every user with every order. That's why all three users show the same inflated total - each is getting the sum of ALL orders.

### Suggested Solution
```sql
SELECT users.name, SUM(orders.amount) AS total
FROM users
JOIN orders ON users.id = orders.user_id
GROUP BY users.name
```

The `JOIN ... ON` clause tells SQL: "only connect rows where the user's id matches the order's user_id."

### Level Up

Think of JOIN as a matching game with two decks of cards. The ON clause is your matching rule. Without it, SQL pairs every card from deck A with every card from deck B - rarely what you want!

-----

## Example 2: WHERE vs HAVING Confusion

<schema>
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price DECIMAL);
-- Sample: 20 products across 5 categories
</schema>

<question>Find categories where the average price is over $50</question>

<user_query>
SELECT category, AVG(price) as avg_price
FROM products
WHERE AVG(price) > 50
GROUP BY category
</user_query>

<query_result>
ERROR: misuse of aggregate: AVG()
</query_result>

<user_level>beginner</user_level>

### Assessment

Almost there! You have the right idea but used WHERE instead of HAVING for the aggregate filter.

### What's Working

Your SELECT and GROUP BY are perfect - you correctly grouped by category and calculated the average price.

### Issues Found

WHERE filters individual rows *before* grouping happens. But AVG(price) doesn't exist yet at that point - it's calculated *after* grouping. That's why SQLite says "misuse of aggregate."

### Suggested Solution

```sql
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 50
```

HAVING filters *after* grouping, so AVG(price) exists and can be compared.

### Level Up

Remember this order: WHERE happens before GROUP BY, HAVING happens after. A simple rule: if you're filtering on an aggregate (SUM, AVG, COUNT, etc.), you need HAVING.

-----

## Example 3: Correct Query

<schema>
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);
</schema>

<question>Find the highest salary in each department</question>

<user_query>
SELECT department, MAX(salary) as highest_salary
FROM employees
GROUP BY department
</user_query>

<query_result>
department     | highest_salary
---------------|---------------
Engineering    | 150000
Marketing      | 120000
Sales          | 95000
</query_result>

<expected_result>
(matches query_result)
</expected_result>

<user_level>beginner</user_level>

### Assessment

Correct! This query does exactly what's asked.

### What's Working

Clean and efficient. You correctly used MAX() to find the highest salary, GROUP BY to get one row per department, and gave the column a clear alias.

### Level Up

Want to also see *who* has that highest salary? That's trickier than it seems - you'd need a subquery or window function. Something to explore when you're ready!
