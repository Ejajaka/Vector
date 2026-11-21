# Northwind Commerce — Checkout & Orders Requirements

**Draft v0.4 · Commerce platform · For review**

This draft consolidates the checkout, orders and admin notes from the commerce
working group. Several decisions remain open; the review captures the
unresolved parts. Status: draft, not approved for build.

## 1. Checkout page

- The Checkout page must show an order summary, a payment form and a Pay now button.
- The Checkout page must show a shipping address form with a postcode field.
- The shipping address field must be mandatory.
- The shipping address field must be optional.
- The customer must click Save address to persist changes to the shipping address.
- The address form must auto-save changes after the customer stops typing.
- The Checkout page must show a Continue button.
- The customer must navigate onward after payment.
- The Checkout page must be public; no login is required.
- The Checkout page must be restricted to logged-in users.
- The Checkout page must be responsive on mobile and tablet.
- The Checkout page must be desktop only and not for mobile.
- The Checkout page must show a loading state while the order total is recalculated.
- The Checkout page must show an empty state when the cart has no items.

## 2. Payments

- The Pay now button must open a confirmation modal.
- The confirmation modal must show the order total and a Place order button.
- The customer must pay with a saved card or enter a new card.
- The card number field must validate the card number and show an invalid state.
- The payment provider must process the card and return a transaction id.
- The system must send an order confirmation after the payment provider processes the payment.
- The Place order button must submit the payment and redirect to the Orders page.
- The payment form should look modern and clean.

## 3. Orders

- The Orders page must show a table of the customer's orders with status, total and created date.
- The Orders page must show an empty state when the customer has no orders.
- The customer must be able to search saved addresses by nickname.
- The customer must be able to edit the shipping address after placing an order.
- The customer must be able to upload a prescription image with the order.
- The Orders page must meet WCAG AA accessibility.
- The Orders page must load in under 2 seconds.
- The customer must be able to reset a forgotten password.
- The password reset form must validate the new password and show an error.
- The Orders table should be user-friendly.

## 4. Admin and permissions

- The admin must be able to view all orders in a table.
- The admin must be able to filter orders by status and date range.
- The admin must be able to search orders by customer name or order number.
- The admin must be able to export the filtered orders as a CSV file.
- Only admin users may delete an order.
- The reviewer must see the order history panel.
- The admin must be able to invite a reviewer to the Orders page.

## 5. Accounts and access

- The account profile must be editable only after the email address is verified.
- The account profile must be read-only for viewers.
- The customer must sign in before editing the account profile.
- The customer must verify the email address before editing the account profile.
- The system must verify the customer's email address after sign-up.
- The email field must be validated before the order is submitted.

## 6. Non-functional requirements

- The system must encrypt payment data at rest.
- The system must retain order records for 7 years.
- The Checkout page must respond within 2 seconds on a 4G connection.
- The Orders page must be usable with a keyboard and screen reader.
- The Checkout page must support English and French localization.
- The system should handle errors appropriately.

---

Prepared for a requirements review. This document deliberately contains unresolved
decisions, conflicts and missing states.
