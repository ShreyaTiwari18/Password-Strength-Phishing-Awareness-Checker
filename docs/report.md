# Project Report: Password Strength & Phishing Awareness Checker

## 1. Problem statement

Many account breaches start with a weak or reused password, or with a phishing email that tricks a person into handing over credentials. Both are easy to prevent if people understand the risk. This project provides two small, privacy-friendly tools that teach these habits: a password checker that explains *why* a password is weak, and a quiz that trains users to recognise phishing emails.

## 2. Concepts from the course and how each is applied

| Concept | How it is applied |
| --- | --- |
| **CIA triad** | *Confidentiality*: strong passwords and phishing awareness keep data away from unauthorised people. *Integrity*: phishing and malware can modify data or systems. *Availability*: account lock-outs and ransomware delivered by phishing can make services unavailable. |
| **Password policy** | The checker implements a typical policy: minimum 12 characters, mixed character types, no common passwords, no repeated characters or sequences. |
| **Access control** | Passwords are the authentication step of access control. The tool explains that only authorised users should pass it. |
| **Common attacks** | *Dictionary attacks* are modelled by the common-password list; *brute force* by the entropy and crack-time estimate; *phishing* and *malware attachments* by the quiz. |
| **Security awareness programme** | The quiz works as awareness training: practice, instant feedback and a summary of the most common signs. |
| **Risk assessment** | The table below rates threats by likelihood and impact and lists mitigations. |

## 3. Risk assessment

| Threat | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Weak passwords (guessed or brute-forced) | High | High | Enforce a password policy (length 12+, no common passwords); use this checker; use a password manager; enable multi-factor authentication |
| Phishing emails (credential theft, malware) | High | High | Security awareness training (this quiz); check sender domains and links; never share OTPs or passwords; email filtering |
| Credential reuse (one breach exposes many accounts) | Medium | High | Use a unique password per account; password manager; multi-factor authentication; monitor breach notifications |

## 4. How the tools work

- **Entropy estimate:** `entropy = length × log2(character pool size)`. The pool grows when lowercase, uppercase, digits and symbols are used. An attacker needs on average `2^(entropy-1)` guesses; dividing by an assumed 10 billion guesses per second gives the displayed time.
- **Common-password check:** the lower-cased password is looked up in a set of about 1,000 known weak passwords. A match is rated Weak and "instantly" cracked, because attackers try such lists first.
- **Pattern checks:** a regular expression finds 3 or more identical characters in a row; a loop finds ascending or descending runs of 4 letters or digits; a short list covers keyboard patterns such as "qwerty".
- **Quiz:** emails are stored as data with red-flag explanations. The order is shuffled using the Fisher-Yates algorithm, and answers are scored in the browser.

## 5. Testing

Automated tests (`node --test tests/password.test.js tests/phishing.test.js`): **19 passed, 0 failed**. Browser checks (`node tests/browser-check.js`, headless Chromium via Playwright): **all passed, no console errors**.

| # | Test case | Expected | Result |
| --- | --- | --- | --- |
| 1 | `password123` | Weak, common-list hit, cracked instantly | Pass |
| 2 | `PASSWORD123` (upper case) | Common-list hit (case-insensitive) | Pass |
| 3 | Empty input | No rating; details hidden | Pass |
| 4 | `Tr0ub4d&3x` (10 chars) | Not Strong; length check fails | Pass |
| 5 | `Tr0ub4dor&3x` (12 chars) | Medium or Strong | Pass |
| 6 | `Correct-Horse-9-Battery!` | Strong; all 8 checks pass; "billions of years" | Pass |
| 7 | `xaaaay` | Repeated-character check fails | Pass |
| 8 | `x1234y`, `xabcdy`, `xdcbay`, `myqwertyx` | Sequence check fails | Pass |
| 9 | `a1c3e5g7` | Sequence check passes | Pass |
| 10 | `abcdefghijkl` | Fails uppercase, number, special, sequence | Pass |
| 11 | Entropy rises with length and character variety | Larger value | Pass |
| 12 | Show/Hide toggle | Input type switches text/password | Pass |
| 13 | Suggestions | 1 to 3 specific tips | Pass |
| 14 | Quiz data | 10 emails, 5 phishing, no real brands | Pass |
| 15 | Shuffle | Same items, input not modified | Pass |
| 16 | Answer checking | Correct and incorrect answers recognised | Pass |
| 17 | Always answering "Phishing" | Score 5 / 10 | Pass |
| 18 | Quiz links | No clickable links in emails | Pass |
| 19 | Restart button | Returns to email 1 of 10 | Pass |
| 20 | Navigation (Home / Password / Quiz) | Each link loads the right page | Pass |
| 21 | Phone width (390 px) | No horizontal scrolling | Pass |

## 6. Limitations and future improvements

**Limitations**
- The common-password list is a small sample, not a complete breach database.
- The crack-time figure assumes random characters and a fixed guess rate, so it is only approximate. It can overestimate passwords built from predictable words and substitutions (for example `P@ssw0rd`-style variations not in the list).
- Only 10 emails exist, so the quiz can be memorised. Real phishing is often more convincing.
- Accessibility was tested with the keyboard and colour contrast in mind, but not with a full screen-reader audit.

**Future improvements**
- Use a larger password list and a pattern-aware estimator (such as zxcvbn).
- Add more emails, difficulty levels, and SMS/voice phishing examples.
- Add multi-factor authentication and password-manager guidance pages.
- Add a "check against known breaches" feature using a privacy-preserving k-anonymity API (this would need an external call, so it would be optional and clearly disclosed).

## 7. What I learned

### Technical skills

### Cybersecurity concepts

### Challenges and how I solved them

### What I would do next
