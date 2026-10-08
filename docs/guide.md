# Project Guide: How to Run It and How to Explain It

## Part 1: How to run the project

You do not need to install anything. It is just a website made of HTML, CSS and JavaScript.

**Option A - Open it online (easiest)**
Open this link in any browser:
https://shreyatiwari18.github.io/Password-Strength-Phishing-Awareness-Checker/

**Option B - Run it on your computer**
1. Go to https://github.com/ShreyaTiwari18/Password-Strength-Phishing-Awareness-Checker
2. Click the green **Code** button, then **Download ZIP**.
3. Unzip the folder.
4. Double-click **index.html**. It opens in your browser.

**Option C - With Git**
```
git clone https://github.com/ShreyaTiwari18/Password-Strength-Phishing-Awareness-Checker.git
cd Password-Strength-Phishing-Awareness-Checker
```
Then open `index.html`.

**How to use it**
- **Password Checker:** type any password. The bar, checklist and tips update as you type. Use **Show** to see what you typed.
- **Phishing Quiz:** read each email, click **Genuine** or **Phishing**, read the explanation, then click **Next email**. At the end you see your score and can restart.

Nothing is saved or sent anywhere. Everything happens inside your browser.

**Optional: run the tests** (needs Node.js)
```
node --test tests/password.test.js tests/phishing.test.js
```

---

## Part 2: How to explain it in college

### The 30-second version
"My project has two small tools that teach basic cyber security. The first checks how strong a password is and explains how to improve it. The second is a quiz with 10 fictional emails where you decide whether each one is real or phishing, and it shows the warning signs. It uses only HTML, CSS and JavaScript, and everything runs in the browser, so no password is ever stored or sent."

### Why I built it
- Most account hacks start with a weak password or a phishing email.
- Both are easy to prevent if people know what to look for.
- This is a hands-on way to apply what I learned in the Cyber Security course.

### How each tool works (simple terms)
**Password checker**
1. It tests the password against 8 rules: length, upper case, lower case, number, symbol, not common, no repeats, no simple patterns.
2. It looks the password up in a list of about 1,000 common passwords. Hackers try those first (a *dictionary attack*).
3. It estimates how long a computer would take to guess it. The longer the password and the more types of characters it uses, the longer it takes. This is only an estimate.
4. Result: Weak, Medium or Strong, plus 2-3 tips.

**Phishing quiz**
1. Each email is stored as data: sender, subject, message, and a list of red flags.
2. The order is shuffled every time.
3. After you answer, it tells you if you were right and explains the red flags.
4. At the end it shows your score and the most common phishing signs.

### Links to the course topics
| Course topic | Where it shows up in my project |
| --- | --- |
| CIA triad (confidentiality) | Strong passwords and phishing awareness keep data from unauthorised people |
| Password policy | The 8-rule checklist works like a company password policy |
| Access control | A password decides who gets access to an account |
| Attacks: phishing, malware, brute force | Quiz emails (including a malware attachment) and the crack-time estimate |
| Security awareness programme | The quiz is a small training exercise with instant feedback |
| Risk assessment | A table in the report rates likelihood, impact and fixes for weak passwords, phishing and password reuse |

### Live demo script (about 2 minutes)
1. Open the home page and point out the privacy note.
2. Go to the Password Checker. Type `password123`. It shows **Weak**, and the checklist shows it is on the common list.
3. Type `Correct-Horse-9-Battery!`. It shows **Strong**. Say: "Length and unpredictability matter more than clever symbols."
4. Go to the Phishing Quiz. Answer one email and read the red flags. Show the fake sender domain (for example `examplebank-secure.co` instead of `examplebank.co`).
5. Finish with the score screen and the list of common phishing signs.

### Questions you may be asked
- **Is my password sent to a server?** No. The code runs in the browser and nothing is stored or sent. There is no backend.
- **Are the companies in the quiz real?** No. All names and domains are made up.
- **How accurate is the crack time?** It is an approximation. It assumes random characters and 10 billion guesses per second.
- **Why 12 characters?** Each extra character multiplies the number of guesses an attacker needs, so length helps the most.
- **What would you improve?** A larger password list, more emails and difficulty levels, and tips on two-factor authentication and password managers.
- **What are the limitations?** The common-password list is only a sample, and the quiz has only 10 emails, so it can be memorised.

### Tips for the presentation
- Run the demo in the online version so it works on any computer.
- Keep a screenshot copy from the `screenshots/` folder in case the internet fails.
- End with the key message: **use long, unique passwords, and check the sender and link before you click.**
