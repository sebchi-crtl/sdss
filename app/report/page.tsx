"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RequireAuth from "@/components/RequireAuth";
import { Camera, MapPin, AlertTriangle, CheckCircle, Upload } from "lucide-react";

export default function ReportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    setSubmitting(true);
    setError("");
    setSuccess(false);
    
    try {
      const res = await fetch("/api/reports", { method: "POST", body: formData });
      const j = await res.json();
      
      if (!res.ok) {
        setError(j.error || "Failed to submit report");
        return;
      }
      
      setSuccess(true);
      form.reset();
      setPhotoPreview(null);
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  return (
    <RequireAuth>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Flood Report</h1>
          <p className="text-gray-600">
            Help us monitor flood conditions by reporting what you see in your area
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Submit a Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Report submitted successfully!</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <Label htmlFor="desc" className="text-base font-medium">
                  What did you observe? *
                </Label>
                <textarea
                  id="desc"
                  name="description"
                  placeholder="Describe the flood conditions you're seeing. Include details like water depth, affected areas, or any immediate concerns..."
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Please provide the exact coordinates of the flood location
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat" className="text-sm">Latitude</Label>
                    <Input 
                      id="lat" 
                      name="lat" 
                      type="number" 
                      step="any" 
                      placeholder="9.025" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lon" className="text-sm">Longitude</Label>
                    <Input 
                      id="lon" 
                      name="lon" 
                      type="number" 
                      step="any" 
                      placeholder="7.325" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="photo" className="text-base font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photo Evidence (Optional)
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a photo to help us better understand the situation
                </p>
                <Input 
                  id="photo" 
                  name="photo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  className="mb-3"
                />
                {photoPreview && (
                  <div className="mt-3">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full max-w-sm rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <span>Be as specific as possible about the location and conditions</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <span>Include water depth, affected areas, and any immediate safety concerns</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <span>Photos help us verify and assess the situation more accurately</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <span>Your report will be reviewed and may be used for emergency response planning</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
