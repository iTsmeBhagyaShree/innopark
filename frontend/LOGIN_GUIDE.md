# 🔐 Login Guide - Client और Employee Dashboard

## 📋 Overview

यह guide बताता है कि Client और Employee कैसे अपने dashboards में login कर सकते हैं।

---

## 👤 Client Dashboard Login

### Step 1: Admin द्वारा Client Create करना

1. Admin panel में जाएं: `/app/admin/clients`
2. "Add Client" button click करें
3. Client की details fill करें:
   - Company Name
   - Owner (User select करें)
   - Email (Primary contact का email)
   - अन्य details
4. "Save Client" click करें

**Note:** Admin को client के लिए user account manually create करना होगा Users page से।

### Step 2: Client Login Credentials

Admin द्वारा client create करने के बाद, client को ये credentials मिलेंगे:

- **Email:** Client का email address (जो admin ने set किया)
- **Password:** Admin द्वारा set किया गया password
- **Role:** `CLIENT`

### Step 3: Client Login Process

1. Login page पर जाएं: `/login`
2. **"Client"** role card select करें
3. Email और Password enter करें
4. "Sign In as Client" button click करें
5. Automatically `/app/client/dashboard` पर redirect हो जाएंगे

### Client Dashboard Features

- View Projects
- View Tasks
- View Invoices
- View Estimates
- View Payments
- View Contracts
- Profile Management

---

## 👔 Employee Dashboard Login

### Step 1: Admin द्वारा Employee Create करना

1. Admin panel में जाएं: `/app/admin/employees`
2. "Add Employee" button click करें
3. Employee की details fill करें:
   - **Name** (required)
   - **Email** (required) - यह login email होगा
   - **Role** (e.g., Developer, Designer, Manager)
   - **Department** (select from dropdown)
   - **Status** (Active/Inactive)
   - **Password** (required) - Employee के लिए login password
4. "Save Employee" button click करें

**Important:** Employee create करते समय password set करना जरूरी है। यह password employee के login के लिए use होगा।

### Step 2: Employee Login Credentials

Employee create करने के बाद, system automatically:
- User account create करता है `users` table में
- Role set करता है: `EMPLOYEE`
- Login credentials ready हो जाते हैं

**Credentials:**
- **Email:** Employee का email address
- **Password:** Admin द्वारा set किया गया password
- **Role:** `EMPLOYEE`

### Step 3: Employee Login Process

1. Login page पर जाएं: `/login`
2. **"Employee"** role card select करें
3. Email और Password enter करें
4. "Sign In as Employee" button click करें
5. Automatically `/app/employee/dashboard` पर redirect हो जाएंगे

### Employee Dashboard Features

- Time Tracking
- Tasks Management
- Projects View
- Attendance
- Notifications
- Profile Management

---

## 🔑 Default Test Credentials

### Admin
- **Email:** `admin@Develo.com` या `admin@crmapp.com`
- **Password:** `Admin@123`
- **Role:** `ADMIN`

### Employee (Demo)
- **Email:** `employee@demo.com`
- **Password:** `Demo@123`
- **Role:** `EMPLOYEE`

### Client (Demo)
- **Email:** `client@demo.com`
- **Password:** `Demo@123`
- **Role:** `CLIENT`

---

## 📝 Important Notes

1. **Password Requirements:**
   - Minimum 6 characters
   - Strong password recommended (uppercase, lowercase, numbers, special characters)

2. **Role Selection:**
   - Login page पर सही role select करना जरूरी है
   - Wrong role select करने पर login fail होगा

3. **Account Status:**
   - Account `Active` status में होना चाहिए
   - Inactive accounts login नहीं कर सकते

4. **Forgot Password:**
   - Currently password reset feature available नहीं है
   - Admin से contact करें password reset के लिए

---

## 🛠️ Troubleshooting

### Login Failed?
1. Email और password सही है या नहीं check करें
2. Role सही select किया है या नहीं verify करें
3. Account status `Active` है या नहीं check करें
4. Browser console में errors check करें

### Role Mismatch Error?
- Login page पर सही role card select करें
- Database में user का role verify करें

### Account Not Found?
- Admin से verify करें कि user account create हुआ है या नहीं
- Email address सही है या नहीं check करें

---

## 📞 Support

अगर login में कोई problem है, तो:
1. Admin से contact करें
2. System administrator को inform करें
3. Error message को note करें और support team को share करें

---

## 🔄 Password Reset (Admin के लिए)

Admin password reset कर सकता है:
1. Users page पर जाएं: `/app/admin/users`
2. User को find करें
3. Edit करें और नया password set करें
4. User को नया password share करें

---

**Last Updated:** 2025-01-20
**Version:** 1.0

