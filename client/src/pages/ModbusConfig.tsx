import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModbusCommand {
  id: string;
  serverAddress: string;
  functionCode: string;
  address: string;
  bytes: string;
  type: string;
}

interface BusConfig {
  protocol: string;
  baudrate: string;
  dataLength: string;
  parity: string;
  stopBits: string;
}

export default function ModbusConfig() {
  const { toast } = useToast();
  
  const [busConfig, setBusConfig] = useState<BusConfig>({
    protocol: 'Modbus RTU',
    baudrate: '9600',
    dataLength: '8',
    parity: 'None',
    stopBits: '1'
  });

  const [commands, setCommands] = useState<ModbusCommand[]>([
    {
      id: '1',
      serverAddress: '01',
      functionCode: '03',
      address: '0000',
      bytes: '0003',
      type: 'int16'
    },
    {
      id: '2', 
      serverAddress: '01',
      functionCode: '03',
      address: '0010',
      bytes: '0002',
      type: 'int16'
    }
  ]);

  const addCommand = () => {
    const newCommand: ModbusCommand = {
      id: Date.now().toString(),
      serverAddress: '01',
      functionCode: '03',
      address: '0000',
      bytes: '0003',
      type: 'int16'
    };
    setCommands([...commands, newCommand]);
  };

  const removeCommand = (id: string) => {
    setCommands(commands.filter(cmd => cmd.id !== id));
  };

  const updateCommand = (id: string, field: keyof ModbusCommand, value: string) => {
    setCommands(commands.map(cmd => 
      cmd.id === id ? { ...cmd, [field]: value } : cmd
    ));
  };

  const generateResults = () => {
    // Generate the result strings in different formats
    const parityMap = {
      'None': 'N',
      'Even': 'E', 
      'Odd': 'O'
    };
    
    const configPart = `R,${busConfig.baudrate},${busConfig.dataLength}${parityMap[busConfig.parity as keyof typeof parityMap]}${busConfig.stopBits}`;
    
    // string_decimal format: R,9600,8N1:[03:0000:int16, 03:0010:int16]
    const decimalArray = commands.map(cmd => 
      `${cmd.functionCode}:${cmd.address}:${cmd.type}`
    );
    const string_decimal = `${configPart}:[${decimalArray.join(', ')}]`;
    
    // string_hex format: R,9600,8N1:[HEX representation]
    const hexArray = commands.map(cmd => {
      const func = parseInt(cmd.functionCode, 16).toString(16).toUpperCase().padStart(2, '0');
      const addr = parseInt(cmd.address, 16).toString(16).toUpperCase().padStart(4, '0');
      const bytes = parseInt(cmd.bytes, 16).toString(16).toUpperCase().padStart(4, '0');
      return `0x${func}${addr}${bytes}`;
    });
    const string_hex = `${configPart}:[${hexArray.join(', ')}]`;
    
    // string_alt format: R,9600,8N1:010300000003,010300100002
    const commandParts = commands.map(cmd => 
      `${cmd.serverAddress}${cmd.functionCode}${cmd.address}${cmd.bytes}`
    ).join(',');
    const string_alt = `${configPart}:${commandParts}`;
    
    return {
      string_decimal,
      string_hex, 
      string_alt
    };
  };

  const copyToClipboard = async (format: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Kopiert!",
        description: `${format} wurde in die Zwischenablage kopiert.`,
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Konnte nicht in die Zwischenablage kopieren.",
        variant: "destructive",
      });
    }
  };
  
  const typeOptions = [
    { value: 'int16', label: 'int16' },
    { value: 'uint16', label: 'uint16' },
    { value: 'int32', label: 'int32' },
    { value: 'uint32', label: 'uint32' }
  ];

  const functionOptions = [
    { value: '03', label: '03 Read Holding Registers' },
    { value: '04', label: '04 Read Input Registers' },
    { value: '01', label: '01 Read Coils' },
    { value: '02', label: '02 Read Discrete Inputs' },
    { value: '06', label: '06 Write Single Register' },
    { value: '16', label: '16 Write Multiple Registers' }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modbus Config Generator</h1>
      </div>

      {/* Bus Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bus Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="protocol">Protocol</Label>
            <Select 
              value={busConfig.protocol} 
              onValueChange={(value) => setBusConfig({...busConfig, protocol: value})}
            >
              <SelectTrigger data-testid="select-protocol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Modbus RTU">Modbus RTU</SelectItem>
                <SelectItem value="Modbus TCP">Modbus TCP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="baudrate">Baudrate</Label>
              <Input
                id="baudrate"
                data-testid="input-baudrate"
                value={busConfig.baudrate}
                onChange={(e) => setBusConfig({...busConfig, baudrate: e.target.value})}
                placeholder="9600"
              />
            </div>

            <div>
              <Label htmlFor="dataLength">Data Length</Label>
              <Select 
                value={busConfig.dataLength} 
                onValueChange={(value) => setBusConfig({...busConfig, dataLength: value})}
              >
                <SelectTrigger data-testid="select-data-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 bits</SelectItem>
                  <SelectItem value="8">8 bits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parity">Parity</Label>
              <Select 
                value={busConfig.parity} 
                onValueChange={(value) => setBusConfig({...busConfig, parity: value})}
              >
                <SelectTrigger data-testid="select-parity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Even">Even</SelectItem>
                  <SelectItem value="Odd">Odd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stopBits">Stop Bits</Label>
              <Select 
                value={busConfig.stopBits} 
                onValueChange={(value) => setBusConfig({...busConfig, stopBits: value})}
              >
                <SelectTrigger data-testid="select-stop-bits">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 bit</SelectItem>
                  <SelectItem value="2">2 bits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commands */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-4 mb-4 font-medium text-sm text-gray-600">
              <div>Server Address</div>
              <div>Function</div>
              <div>Address</div>
              <div># Bytes</div>
              <div>Typ</div>
              <div></div>
            </div>
            
            <div className="space-y-3">
              {commands.map((command) => (
                <div key={command.id} className="grid grid-cols-6 gap-4 items-center">
                  <div>
                    <Input
                      data-testid={`input-server-address-${command.id}`}
                      value={command.serverAddress}
                      onChange={(e) => updateCommand(command.id, 'serverAddress', e.target.value)}
                      placeholder="01"
                      className="text-center"
                    />
                  </div>

                  <div>
                    <Select 
                      value={command.functionCode} 
                      onValueChange={(value) => updateCommand(command.id, 'functionCode', value)}
                    >
                      <SelectTrigger data-testid={`select-function-${command.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {functionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Input
                      data-testid={`input-address-${command.id}`}
                      value={command.address}
                      onChange={(e) => updateCommand(command.id, 'address', e.target.value)}
                      placeholder="0000"
                      className="text-center"
                    />
                  </div>

                  <div>
                    <Input
                      data-testid={`input-bytes-${command.id}`}
                      value={command.bytes}
                      onChange={(e) => updateCommand(command.id, 'bytes', e.target.value)}
                      placeholder="0003"
                      className="text-center"
                    />
                  </div>

                  <div>
                    <Select 
                      value={command.type} 
                      onValueChange={(value) => updateCommand(command.id, 'type', value)}
                    >
                      <SelectTrigger data-testid={`select-type-${command.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Button 
                      data-testid={`button-delete-${command.id}`}
                      variant="outline" 
                      size="sm"
                      onClick={() => removeCommand(command.id)}
                      className="p-2 h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              data-testid="button-add-command"
              variant="outline" 
              onClick={addCommand}
              className="mt-4 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add command
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* string_decimal */}
            <div>
              <Label className="text-sm font-medium text-gray-700">string_decimal:</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                  <span data-testid="text-result-decimal">{generateResults().string_decimal}</span>
                </div>
                <Button 
                  data-testid="button-copy-decimal"
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('string_decimal', generateResults().string_decimal)}
                  className="p-2 h-9 w-9"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* string_hex */}
            <div>
              <Label className="text-sm font-medium text-gray-700">string_hex:</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                  <span data-testid="text-result-hex">{generateResults().string_hex}</span>
                </div>
                <Button 
                  data-testid="button-copy-hex"
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('string_hex', generateResults().string_hex)}
                  className="p-2 h-9 w-9"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* string_alt */}
            <div>
              <Label className="text-sm font-medium text-gray-700">string_alt:</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                  <span data-testid="text-result-alt">{generateResults().string_alt}</span>
                </div>
                <Button 
                  data-testid="button-copy-alt"
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('string_alt', generateResults().string_alt)}
                  className="p-2 h-9 w-9"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}