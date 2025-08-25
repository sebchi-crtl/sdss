"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/RequireAuth";

export default function ReportPage() {
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", { method: "POST", body: formData });
      const j = await res.json();
      alert("Report submitted: " + j.id);
      form.reset();
    } catch (e) {
      console.error(e);
      alert("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth>
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-semibold">Community Flood Report</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" name="description" placeholder="e.g. Water entering houses at XYZ…" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" name="lat" type="number" step="any" placeholder="9.025" required />
            </div>
            <div>
              <Label htmlFor="lon">Longitude</Label>
              <Input id="lon" name="lon" type="number" step="any" placeholder="7.325" required />
            </div>
          </div>
          <div>
            <Label htmlFor="photo">Photo (optional)</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" />
          </div>
          <Button disabled={submitting}>{submitting ? "Submitting…" : "Submit Report"}</Button>
        </form>
      </div>
    </RequireAuth>
  );
}
