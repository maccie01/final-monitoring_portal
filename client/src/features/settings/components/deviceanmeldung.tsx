import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, Info, Signal, SignalLow } from "lucide-react";
import netzwaechterImage from "./netzwaechter.jpg";

interface DeviceRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceRegistration({ isOpen, onClose }: DeviceRegistrationProps) {
  const [deviceLabel, setDeviceLabel] = useState("");
  const [objectName, setObjectName] = useState("");
  const [objectLocation, setObjectLocation] = useState("");
  const [installationRoom, setInstallationRoom] = useState("");
  const [signalStrength, setSignalStrength] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [showNetzwaechterImage, setShowNetzwaechterImage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!deviceLabel || !objectName || !installationRoom) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    // Here would be the API call to submit the device registration
    console.log("Device Registration Data:", {
      deviceLabel,
      objectName,
      objectLocation,
      installationRoom,
      signalStrength,
      referenceNumber,
      company,
      contactName,
      email
    });

    // Reset form and close modal
    setDeviceLabel("");
    setObjectName("");
    setObjectLocation("");
    setInstallationRoom("");
    setSignalStrength("");
    setReferenceNumber("");
    setCompany("");
    setContactName("");
    setEmail("");
    onClose();
    
    alert("Geräteanmeldung erfolgreich eingereicht!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full bg-white/95 backdrop-blur-sm border-none shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-xl font-semibold text-[#21496E]">Gerät anmelden</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            data-testid="button-close-device-registration"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Geräte-SN */}
            <div className="space-y-2">
              <Label htmlFor="deviceLabel" className="text-sm font-medium text-gray-700 flex items-center gap-2">
Geräte-SN * 
                <Info 
                  className="h-4 w-4 text-blue-500 cursor-help" 
                  onMouseEnter={() => setShowNetzwaechterImage(true)}
                  onMouseLeave={() => setShowNetzwaechterImage(false)}
                />
              </Label>
              <Input
                id="deviceLabel"
                type="text"
                placeholder="Geräte-SN finden Sie auf dem Deckel des Netzwächter"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
                className="w-full"
                data-testid="input-device-label"
                required
              />
              {/* Netzwächter Bild beim Hovern */}
              {showNetzwaechterImage && (
                <div className="mt-3 transition-opacity duration-200">
                  <p className="text-xs text-gray-600 mb-2">Geräte-SN finden Sie auf dem Deckel des Netzwächter:</p>
                  <img 
                    src={netzwaechterImage} 
                    alt="Netzwächter Seriennummer" 
                    className="w-full max-w-xs mx-auto h-auto rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Objektbezeichnung */}
            <div className="space-y-2">
              <Label htmlFor="objectName" className="text-sm font-medium text-gray-700">
                Objektbezeichnung *
              </Label>
              <Input
                id="objectName"
                type="text"
                placeholder="Tragen Sie die Objekt-/Projektbezeichnung ein"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="w-full"
                data-testid="input-object-name"
                required
              />
            </div>

            {/* Ort des Objektes */}
            <div className="space-y-2">
              <Label htmlFor="objectLocation" className="text-sm font-medium text-gray-700">
                Ort des Objektes
              </Label>
              <Input
                id="objectLocation"
                type="text"
                placeholder="Ortsname, PLZ, Strasse Nr"
                value={objectLocation}
                onChange={(e) => setObjectLocation(e.target.value)}
                className="w-full"
                data-testid="input-object-location"
              />
            </div>

            {/* Installation-Ort / Raum */}
            <div className="space-y-2">
              <Label htmlFor="installationRoom" className="text-sm font-medium text-gray-700">
                Installation-Ort / Raum *
              </Label>
              <Input
                id="installationRoom"
                type="text"
                placeholder="Tragen Sie Heizraum, Keller, etc. ein"
                value={installationRoom}
                onChange={(e) => setInstallationRoom(e.target.value)}
                className="w-full"
                data-testid="input-installation-room"
                required
              />
            </div>

            {/* Funkverbindung Handyempfang */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Funkverbindung Handyempfang
              </Label>
              <RadioGroup value={signalStrength} onValueChange={setSignalStrength}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="mind-2-balken" 
                    id="signal-good"
                    data-testid="radio-signal-good"
                  />
                  <Label htmlFor="signal-good" className="text-sm text-gray-700 flex items-center gap-2">
                    <Signal className="h-4 w-4 text-green-600" />
                    mehr als 2 Balken (gut)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="weniger-2-balken" 
                    id="signal-weak"
                    data-testid="radio-signal-weak"
                  />
                  <Label htmlFor="signal-weak" className="text-sm text-gray-700 flex items-center gap-2">
                    <SignalLow className="h-4 w-4 text-red-600" />
                    weniger als 2 Balken (schlecht)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Auftrag / Lieferschein / Referenz Nr */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber" className="text-sm font-medium text-gray-700">
                Auftrag / Lieferschein / Referenz Nr
              </Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="Tragen Sie eine dieser Nummern ein"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full"
                data-testid="input-reference-number"
              />
            </div>

            {/* Ihre Firma / oder für Welche Gesellschaft */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                Ihre Firma / oder für welche Gesellschaft
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="Firmaname"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full"
                data-testid="input-company"
              />
            </div>

            {/* Ihr Name */}
            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-sm font-medium text-gray-700">
                Ihr Name
              </Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Ihren oder des Verantwortlichen Namen"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full"
                data-testid="input-contact-name"
              />
            </div>

            {/* E-Mail / Empfänger */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-Mail / Empfänger
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Der benachrichtigt werden soll"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                data-testid="input-email"
              />
            </div>

            {/* Pflichtfelder Notice */}
            <p className="text-sm text-gray-500 italic">* Pflichtfelder</p>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#21496E] hover:bg-[#1a3a5a] text-white py-3 text-lg font-medium"
              data-testid="button-submit-device-registration"
            >
              Anmeldung einreichen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}