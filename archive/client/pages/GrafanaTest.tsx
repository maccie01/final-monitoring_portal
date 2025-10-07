import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { buildGrafanaUrl } from '@/utils/grafanaConfig';

export default function GrafanaTest() {
  const iframe1Ref = useRef<HTMLIFrameElement>(null);
  const iframe2Ref = useRef<HTMLIFrameElement>(null);

  // URLs werden dynamisch generiert
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");

  // URLs beim Start generieren
  useEffect(() => {
    const generateUrls = async () => {
      try {
        const url1Generated = await buildGrafanaUrl({
          panelId: '25',
          meterId: '49736179',
          timeRange: '2d',
          additionalParams: { timezone: 'browser' }
        });
        const url2Generated = await buildGrafanaUrl({
          panelId: '25',
          meterId: '49736179',
          timeRange: '60d',
          additionalParams: { timezone: 'browser' }
        });
        setUrl1(url1Generated);
        setUrl2(url2Generated);
      } catch (error) {
        console.error('Error generating initial URLs:', error);
        // Fallback URLs
        setUrl1("https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-2d&to=now&timezone=browser&var-id=49736179&panelId=25");
        setUrl2("https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare?orgId=1&from=now-60d&to=now&timezone=browser&var-id=49736179&panelId=25");
      }
    };
    generateUrls();
  }, []);

  const loadBoth = () => {
    console.log('Loading both iframes...');
    if (iframe1Ref.current) {
      iframe1Ref.current.src = url1;
      console.log('Loaded iframe 1:', url1.substring(0, 50));
    }
    if (iframe2Ref.current) {
      iframe2Ref.current.src = url2;
      console.log('Loaded iframe 2:', url2.substring(0, 50));
    }
  };

  const loadSmooth = () => {
    console.log('Loading smooth with 2.3s fade...');
    // Fade out
    if (iframe1Ref.current) {
      iframe1Ref.current.style.opacity = '0.3';
      iframe1Ref.current.style.transition = 'opacity 2.3s ease';
    }
    if (iframe2Ref.current) {
      iframe2Ref.current.style.opacity = '0.3';
      iframe2Ref.current.style.transition = 'opacity 2.3s ease';
    }
    
    // Load after fade
    setTimeout(() => {
      if (iframe1Ref.current) {
        iframe1Ref.current.src = url1;
      }
      if (iframe2Ref.current) {
        iframe2Ref.current.src = url2;
      }
      console.log('Smooth fade loading complete');
    }, 2300);
  };

  const loadDelayed = () => {
    console.log('Loading delayed in 1 second...');
    setTimeout(() => {
      if (iframe1Ref.current) {
        iframe1Ref.current.src = url1;
      }
      if (iframe2Ref.current) {
        iframe2Ref.current.src = url2;
      }
      console.log('Delayed loading complete');
    }, 1000);
  };

  const loadPreloaded = () => {
    console.log('Loading preloaded in 2 seconds...');
    setTimeout(() => {
      if (iframe1Ref.current) {
        iframe1Ref.current.src = url1;
      }
      if (iframe2Ref.current) {
        iframe2Ref.current.src = url2;
      }
      console.log('Preloaded loading complete');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Grafana Test: 2d vs 60d</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>URL 1 (-2d)</Label>
                  <Input
                    value={url1}
                    onChange={(e) => setUrl1(e.target.value)}
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label>URL 2 (-60d)</Label>
                  <Input
                    value={url2}
                    onChange={(e) => setUrl2(e.target.value)}
                    className="text-xs mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Button onClick={loadBoth} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Load Both
                  </Button>

                  <Button onClick={loadSmooth} variant="outline" className="w-full">
                    🌊 Smooth
                  </Button>

                  <Button onClick={loadDelayed} variant="outline" className="w-full">
                    ⏰ Delayed
                  </Button>

                  <Button onClick={loadPreloaded} variant="outline" className="w-full">
                    🚀 Preloaded
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* iframes */}
          <div className="lg:col-span-3 space-y-2">
            <div>
              <h3 className="text-sm font-medium text-blue-700 mb-1">iframe 1: -2d</h3>
              <iframe
                ref={iframe1Ref}
                width="100%"
                height="200"
                frameBorder="0"
                className="border rounded"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-green-700 mb-1">iframe 2: -60d</h3>
              <iframe
                ref={iframe2Ref}
                width="100%"
                height="200"
                frameBorder="0"
                className="border rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}