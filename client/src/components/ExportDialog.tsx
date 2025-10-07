import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, File, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportDialogProps {
  data: any[];
  filename?: string;
  title?: string;
  trigger?: React.ReactNode;
  userEmail?: string;
  filterInfo?: {
    efficiencyFilter?: string;
    buildingTypeFilter?: string;
    searchTerm?: string;
  };
}

export default function ExportDialog({ 
  data, 
  filename = "export", 
  title = "Daten exportieren",
  trigger,
  userEmail,
  filterInfo
}: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [sendEmail, setSendEmail] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus("processing");
      setProgress(20);

      if (exportFormat === "csv") {
        // CSV Export
        const csvContent = generateCSV(data);
        
        if (sendEmail && userEmail) {
          const csvBlob = new Blob([csvContent], { type: "text/csv" });
          const formData = new FormData();
          formData.append('file', csvBlob, `${filename}.csv`);
          formData.append('email', userEmail);
          formData.append('subject', 'Portfolio Objekte - CSV Export');
          
          await apiRequest('POST', '/api/export/send-email', formData);
          
          toast({
            title: "E-Mail versendet",
            description: `CSV wurde an ${userEmail} gesendet`,
          });
        } else {
          downloadFile(csvContent, `${filename}.csv`, "text/csv");
        }
        setProgress(100);
      } else {
        // PDF Export als A4-Tabelle
        setProgress(40);
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4"
        });

        // Header mit Filter-Informationen
        doc.setFontSize(16);
        let headerText = "Portfolio Objekte";
        if (filterInfo) {
          const filters = [];
          if (filterInfo.efficiencyFilter && filterInfo.efficiencyFilter !== "all") {
            filters.push(`Filter: ${filterInfo.efficiencyFilter}`);
          }
          if (filterInfo.buildingTypeFilter && filterInfo.buildingTypeFilter !== "all") {
            filters.push(`Typ: ${filterInfo.buildingTypeFilter}`);
          }
          if (filterInfo.searchTerm) {
            filters.push(`"${filterInfo.searchTerm}"`);
          }
          if (filters.length > 0) {
            headerText += ` - ${filters.join(", ")}`;
          }
        }
        doc.text(headerText, 14, 15);
        
        doc.setFontSize(10);
        const today = new Date();
        const dateStr = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
        doc.text(`Erstellt am: ${dateStr}`, 14, 22);

        setProgress(60);

        // Tabellendaten vorbereiten
        const tableData = data.map(obj => [
          obj.name || "-",
          obj.kianalyse?.info || "-",
          obj.objdata?.area > 0 ? `${obj.objdata.area.toLocaleString('de-DE')} m²${obj.objdata?.NE ? ` (${obj.objdata.NE})` : ''}` : "-",
          obj.efficiency > 0 ? `${obj.efficiency} kWh/m²` : "-",
          obj.efficiencyClass || "-",
          obj.renewable > 0 ? `${obj.renewableShare}%` : "0%",
          obj.vlTemp !== null ? `${obj.vlTemp}°C` : "-",
          obj.rlTemp !== null ? `${obj.rlTemp}°C` : "-"
        ]);

        setProgress(80);

        // AutoTable generieren
        autoTable(doc, {
          head: [["Objekt", "Info/Potential", "Fläche", "Verbrauch", "Klasse", "Regenerativ", "VL-Temp", "RL-Temp"]],
          body: tableData,
          startY: 28,
          styles: { 
            fontSize: 9,
            cellPadding: 2
          },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          margin: { top: 28, left: 14, right: 14 }
        });

        setProgress(90);

        // PDF speichern oder per E-Mail senden
        if (sendEmail && userEmail) {
          const pdfBlob = doc.output('blob');
          const formData = new FormData();
          formData.append('file', pdfBlob, `${filename}.pdf`);
          formData.append('email', userEmail);
          formData.append('subject', headerText);
          
          await apiRequest('POST', '/api/export/send-email', formData);
          
          toast({
            title: "E-Mail versendet",
            description: `PDF wurde an ${userEmail} gesendet`,
          });
        } else {
          doc.save(`${filename}.pdf`);
        }
        setProgress(100);
      }

      setExportStatus("success");
      toast({
        title: "Export erfolgreich",
        description: `${exportFormat.toUpperCase()}-Datei wurde heruntergeladen`,
      });

      // Dialog nach kurzer Verzögerung schließen
      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 1500);

    } catch (error) {
      console.error("Export error:", error);
      setExportStatus("error");
      toast({
        title: "Export fehlgeschlagen",
        description: "Beim Exportieren ist ein Fehler aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return "";

    const headers = ["Objekt", "Info/Potential", "Fläche", "Verbrauch", "Klasse", "Regenerativanteil", "VL-Temp", "RL-Temp"];
    const rows = data.map(obj => [
      obj.name || "",
      obj.kianalyse?.info || "",
      obj.objdata?.area > 0 ? `${obj.objdata.area} m²${obj.objdata?.NE ? ` (${obj.objdata.NE})` : ''}` : "",
      obj.efficiency > 0 ? `${obj.efficiency} kWh/m²` : "",
      obj.efficiencyClass || "",
      obj.renewable > 0 ? `${obj.renewableShare}%` : "0%",
      obj.vlTemp !== null ? `${obj.vlTemp}°C` : "",
      obj.rlTemp !== null ? `${obj.rlTemp}°C` : ""
    ]);

    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setProgress(0);
    setExportStatus("idle");
    setExportFormat("csv");
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (exportStatus) {
      case "processing":
        return `Exportiere ${exportFormat.toUpperCase()}...`;
      case "success":
        return "Export abgeschlossen!";
      case "error":
        return "Export fehlgeschlagen";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" data-testid="button-export-trigger">
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-export">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export-Format</label>
            <Select 
              value={exportFormat} 
              onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}
              disabled={isExporting}
              data-testid="select-export-format"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv" data-testid="option-csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV (Komma-getrennte Werte)
                  </div>
                </SelectItem>
                <SelectItem value="pdf" data-testid="option-pdf">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    PDF (Druckfähiges Dokument)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress Section */}
          {(isExporting || exportStatus !== "idle") && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon()}
                <span data-testid="text-export-status">{getStatusText()}</span>
              </div>
              
              {exportStatus === "processing" && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" data-testid="progress-export" />
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round(progress)}% abgeschlossen
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Info */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <strong>{data.length}</strong> Einträge werden exportiert
          </div>

          {/* E-Mail Option */}
          {userEmail && exportFormat === "pdf" && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-email" 
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                disabled={isExporting}
                data-testid="checkbox-send-email"
              />
              <label 
                htmlFor="send-email" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                E-Mail versenden an {userEmail}
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
              data-testid="button-start-export"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportiere...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export starten
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
              data-testid="button-cancel-export"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}