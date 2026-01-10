# Advanced Examples

## Example 1: Window Function Opportunity

<schema>
CREATE TABLE sales (id INTEGER, rep_id INTEGER, amount DECIMAL, sale_date DATE);
CREATE TABLE reps (id INTEGER PRIMARY KEY, name TEXT, team TEXT);
</schema>

<question>For each sale, show the rep name, amount, and running total for that rep</question>

<user_query>
SELECT
  r.name,
  s.amount,
  (SELECT SUM(s2.amount)
   FROM sales s2
   WHERE s2.rep_id = s.rep_id
   AND s2.sale_date <= s.sale_date) as running_total
FROM sales s
JOIN reps r ON s.rep_id = r.id
ORDER BY r.name, s.sale_date
</user_query>

<query_result>
name  | amount | running_total
------|--------|-------------
Alice | 500    | 500
Alice | 300    | 800
Alice | 200    | 1000
Bob   | 400    | 400
Bob   | 600    | 1000
</query_result>

<expected_result>
(matches)
</expected_result>

<user_level>advanced</user_level>

### Assessment
Correct, but the correlated subquery approach is O(n²). Window functions are more elegant here.

### What's Working
The logic is correct and handles the per-rep partitioning properly. The ordering is also correct.

### Suggested Solution
```sql
SELECT
  r.name,
  s.amount,
  SUM(s.amount) OVER (
    PARTITION BY s.rep_id
    ORDER BY s.sale_date
    ROWS UNBOUNDED PRECEDING
  ) as running_total
FROM sales s
JOIN reps r ON s.rep_id = r.id
ORDER BY r.name, s.sale_date
```

### Level Up

Window functions with frame clauses (ROWS UNBOUNDED PRECEDING) are computed in a single pass. The optimizer can often use indexes on the PARTITION BY and ORDER BY columns. For running totals, this pattern is both cleaner and faster.

-----

## Example 2: Subtle Date Boundary Bug

<schema>
CREATE TABLE events (id INTEGER, name TEXT, event_time DATETIME);
-- event_time includes time component, e.g., '2024-01-15 14:30:00'
</schema>

<question>Count events that occurred in January 2024</question>

<user_query>
SELECT COUNT(*)
FROM events
WHERE event_time >= '2024-01-01'
AND event_time <= '2024-01-31'
</user_query>

<query_result>
COUNT(*)
--------
42
</query_result>

<expected_result>
45
</expected_result>

<user_level>advanced</user_level>

### Assessment

Subtly incorrect - this misses events on January 31st after midnight (00:00:00).

### Issues Found

`'2024-01-31'` is interpreted as `'2024-01-31 00:00:00'`. Any event on Jan 31st with a time component (e.g., 14:30:00) is excluded.

### Suggested Solution

```sql
SELECT COUNT(*)
FROM events
WHERE event_time >= '2024-01-01'
  AND event_time < '2024-02-01'
```

Using `< next_month` is the safest pattern - it automatically handles the time component and varying month lengths.

### Level Up

Date boundary bugs are subtle and common. The pattern `>= start AND < exclusive_end` is defensive: it works regardless of time precision (DATE, DATETIME, TIMESTAMP with microseconds). It also handles leap years and month-length variations automatically.
