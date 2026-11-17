"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import {
  ChevronDown,
  CreditCard,
  EllipsisVertical,
  LockKeyhole,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useAuthMe } from "@/hooks/useAuthMe";
import {
  parsePaymentMethods,
  paymentMethodsKey,
  paymentMethodsSnapshot,
  savePaymentMethods,
  subscribePaymentMethods,
  type CardBrand,
  type PaymentMethod
} from "./payment-method-storage";

type PaymentForm = {
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholder: string;
  country: string;
  zip: string;
};

const emptyForm: PaymentForm = {
  cardNumber: "",
  expiry: "",
  cvc: "",
  cardholder: "",
  country: "United States",
  zip: ""
};

function CardBrandLogo({ brand }: { brand: CardBrand }) {
  if (brand === "mastercard") {
    return (
      <span className="relative flex h-8 w-12 items-center justify-center rounded bg-black">
        <span className="h-5 w-5 rounded-full bg-red-500" />
        <span className="-ml-2 h-5 w-5 rounded-full bg-amber-400 opacity-95" />
      </span>
    );
  }

  return (
    <span className="flex h-8 w-12 items-center justify-center rounded border border-gray-100 bg-white text-sm font-black italic tracking-tighter text-blue-700 shadow-sm">
      VISA
    </span>
  );
}

function AcceptedCards() {
  return (
    <div className="flex items-center gap-1" aria-label="Accepted card types">
      <span className="text-[8px] font-black italic text-blue-700">VISA</span>
      <span className="flex items-center">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="-ml-1.5 h-3 w-3 rounded-full bg-amber-400" />
      </span>
      <span className="rounded-sm bg-blue-600 px-1 text-[6px] font-bold text-white">
        AMEX
      </span>
      <span className="rounded-sm bg-blue-900 px-1 text-[6px] font-bold text-white">
        DISC
      </span>
    </div>
  );
}

function PaymentCard({
  method,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete
}: {
  method: PaymentMethod;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="relative grid items-center gap-4 rounded-lg border border-gray-200 px-3 py-4 sm:grid-cols-[130px_1fr_1.3fr_auto]">
      <div className="flex items-center gap-3">
        <CardBrandLogo brand={method.brand} />
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[10px] font-semibold text-gray-950">
            {method.brand === "visa" ? "VISA" : "MASTER CARD"} ----{" "}
            {method.lastFour}
          </p>
          <p className="text-[9px] text-gray-500">Expires {method.expires}</p>
        </div>
      </div>

      <div>
        <p className="text-[9px] text-gray-500">Cardholder Name</p>
        <p className="truncate text-[10px] font-semibold text-gray-950">
          {method.cardholder}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-[9px] text-gray-500">Billing Address</p>
        <p className="truncate text-[10px] font-semibold text-gray-950">
          {method.billingAddress}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleMenu}
        className="absolute right-2 top-2 cursor-pointer rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-50 sm:static"
        aria-label={`Actions for card ending ${method.lastFour}`}
        aria-expanded={menuOpen}
      >
        <EllipsisVertical className="h-3.5 w-3.5" />
      </button>

      {menuOpen && (
        <div className="absolute right-2 top-10 z-10 w-24 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={onEdit}
            className="block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-normal text-gray-800 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-normal text-red-500 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}

function PaymentMethodDialog({
  mode,
  form,
  onChange,
  onClose,
  onSubmit
}: {
  mode: "add" | "edit";
  form: PaymentForm;
  onChange: (form: PaymentForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function setField<K extends keyof PaymentForm>(
    key: K,
    value: PaymentForm[K]
  ) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-dialog-title"
        className="relative w-full max-w-xl rounded-xl border border-primary-500 bg-white p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer rounded-md p-1 text-gray-700 hover:bg-gray-100"
          aria-label="Close payment method form"
        >
          <X className="h-5 w-5" />
        </button>

        <h3
          id="payment-dialog-title"
          className="pr-8 text-lg font-semibold text-gray-950"
        >
          {mode === "add" ? "Add New Payment Method" : "Edit Payment Method"}
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-normal text-gray-600">
              Card information
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
              <div className="flex h-10 items-center px-3">
                <input
                  required
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={(event) =>
                    setField(
                      "cardNumber",
                      event.target.value.replace(/[^\d ]/g, "").slice(0, 19)
                    )
                  }
                  placeholder="1234 1234 1234 1234"
                  className="min-w-0 flex-1 text-xs outline-none placeholder:text-gray-400"
                />
                <AcceptedCards />
              </div>
              <div className="grid grid-cols-2 border-t border-gray-200">
                <input
                  required
                  value={form.expiry}
                  onChange={(event) =>
                    setField("expiry", event.target.value.slice(0, 5))
                  }
                  placeholder="MM / YY"
                  className="h-10 border-r border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400"
                />
                <div className="flex items-center px-3">
                  <input
                    required
                    inputMode="numeric"
                    value={form.cvc}
                    onChange={(event) =>
                      setField(
                        "cvc",
                        event.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    placeholder="CVC"
                    className="min-w-0 flex-1 text-xs outline-none placeholder:text-gray-400"
                  />
                  <LockKeyhole className="h-3.5 w-3.5 text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-normal text-gray-600">
              Cardholder name
            </span>
            <input
              required
              value={form.cardholder}
              onChange={(event) => setField("cardholder", event.target.value)}
              placeholder="Full name on card"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div>
            <label className="mb-2 block text-xs font-normal text-gray-600">
              Country or region
            </label>
            <div className="relative">
              <select
                value={form.country}
                onChange={(event) => setField("country", event.target.value)}
                className="h-10 w-full appearance-none rounded-t-lg border border-gray-200 bg-white px-3 pr-9 text-xs text-gray-600 outline-none focus:border-primary-500"
              >
                <option>United States</option>
                <option>Indonesia</option>
                <option>Singapore</option>
                <option>Malaysia</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
            <input
              required
              value={form.zip}
              onChange={(event) => setField("zip", event.target.value)}
              placeholder="ZIP"
              className="-mt-px h-10 w-full rounded-b-lg border border-gray-200 px-3 text-xs outline-none placeholder:text-gray-400 focus:z-10 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 cursor-pointer rounded-lg border border-gray-200 px-4 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-lg bg-primary-700 px-4 text-xs font-medium text-white hover:bg-primary-800"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export function PaymentMethodSettings() {
  const { data: me, isLoading } = useAuthMe();
  const storageKey = paymentMethodsKey(me?.user_id, me?.tenant_id);
  const snapshot = useSyncExternalStore(
    subscribePaymentMethods,
    () => paymentMethodsSnapshot(storageKey),
    () => null
  );
  const methods = useMemo(() => parsePaymentMethods(snapshot), [snapshot]);
  return (
    <PaymentMethodContent
      key={storageKey ?? "signed-out"}
      storageKey={storageKey}
      methods={methods}
      isLoading={isLoading}
    />
  );
}

function PaymentMethodContent({
  storageKey,
  methods,
  isLoading
}: {
  storageKey: string | null;
  methods: PaymentMethod[];
  isLoading: boolean;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(emptyForm);

  function closeDialog() {
    setDialogMode(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  function persistMethods(next: PaymentMethod[]) {
    try {
      savePaymentMethods(storageKey, next);
      return true;
    } catch {
      toast.error(
        "Could not save payment methods in this browser. Please try again."
      );
      return false;
    }
  }

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogMode("add");
  }

  function openEditDialog(method: PaymentMethod) {
    setOpenMenuId(null);
    setEditingId(method.id);
    setForm({
      cardNumber: `•••• •••• •••• ${method.lastFour}`,
      expiry: method.expires,
      cvc: "",
      cardholder: method.cardholder,
      country: method.country,
      zip: method.zip
    });
    setDialogMode("edit");
  }

  function deleteMethod(method: PaymentMethod) {
    if (!persistMethods(methods.filter((item) => item.id !== method.id)))
      return;
    setOpenMenuId(null);
    toast.success("Payment method deleted");
  }

  function saveMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = form.cardNumber.replace(/\D/g, "");
    if (dialogMode === "add" && digits.length < 12) {
      toast.error("Enter a valid card number.");
      return;
    }

    if (dialogMode === "add") {
      const brand: CardBrand = digits.startsWith("5") ? "mastercard" : "visa";
      const lastFour = digits.slice(-4);
      if (
        !persistMethods([
          ...methods,
          {
            id: `${brand}-${lastFour}-${Date.now()}`,
            brand,
            lastFour,
            expires: form.expiry,
            cardholder: form.cardholder,
            billingAddress: `${form.country}, ${form.zip}`,
            country: form.country,
            zip: form.zip
          }
        ])
      )
        return;
      toast.success("Payment method added");
    } else {
      if (
        !persistMethods(
          methods.map((method) =>
            method.id === editingId
              ? {
                  ...method,
                  expires: form.expiry,
                  cardholder: form.cardholder,
                  billingAddress: `${form.country}, ${form.zip}`,
                  country: form.country,
                  zip: form.zip
                }
              : method
          )
        )
      )
        return;
      toast.success("Payment method updated");
    }

    closeDialog();
  }

  return (
    <>
      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-950">
            Payment Method
          </h2>
          <button
            type="button"
            onClick={openAddDialog}
            disabled={!storageKey || isLoading}
            className="ml-auto h-8 cursor-pointer rounded-md bg-primary-700 px-4 text-[10px] font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add New
          </button>
        </div>
        <p className="mt-2 text-[10px] text-gray-500">
          Prototype: card display details are saved only in this browser, not
          registered for payments. Full card numbers and CVCs are not saved.
        </p>

        <div className="mt-4 space-y-4">
          {methods.map((method) => (
            <PaymentCard
              key={method.id}
              method={method}
              menuOpen={openMenuId === method.id}
              onToggleMenu={() =>
                setOpenMenuId((current) =>
                  current === method.id ? null : method.id
                )
              }
              onEdit={() => openEditDialog(method)}
              onDelete={() => deleteMethod(method)}
            />
          ))}

          {methods.length === 0 && (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-center">
              <CreditCard className="h-7 w-7 text-gray-400" />
              <p className="mt-2 text-xs font-medium text-gray-700">
                {isLoading
                  ? "Loading payment methods..."
                  : storageKey
                    ? "No payment methods"
                    : "Payment methods unavailable"}
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                {storageKey
                  ? "Add a card to get started."
                  : "Your account must be available to save card details."}
              </p>
            </div>
          )}
        </div>
      </section>

      {dialogMode && (
        <PaymentMethodDialog
          mode={dialogMode}
          form={form}
          onChange={setForm}
          onClose={closeDialog}
          onSubmit={saveMethod}
        />
      )}
    </>
  );
}
