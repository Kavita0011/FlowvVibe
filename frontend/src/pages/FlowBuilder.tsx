import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ReactFlow, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Save, Play, Download, Upload, 
  Settings, Plus, Trash2, Loader2, MessageSquare, GitBranch, 
  Clock, Zap, Mail, Phone, Globe, UserPlus, Calendar, UserCheck, Database
} from 'lucide-react';
import CustomNode from '../components/CustomNode';

const nodeCategories = {
  'AI/ML': [
    { type: 'aiResponse', label: 'AI Response', icon: Zap },
    { type: 'intentDetection', label: 'Intent Detection', icon: Zap },
    { type: 'sentimentAnalysis', label: 'Sentiment', icon: Zap },
  ],
  'Input': [
    { type: 'textInput', label: 'Text Input', icon: MessageSquare },
    { type: 'yesNoInput', label: 'Yes/No', icon: GitBranch },
    { type: 'choiceInput', label: 'Choice', icon: GitBranch },
    { type: 'emailInput', label: 'Email', icon: Mail },
    { type: 'phoneInput', label: 'Phone', icon: Phone },
  ],
  'Logic': [
    { type: 'condition', label: 'Condition', icon: GitBranch },
    { type: 'branch', label: 'Branch', icon: GitBranch },
    { type: 'delay', label: 'Delay', icon: Clock },
  ],
  'Action': [
    { type: 'sendEmail', label: 'Send Email', icon: Mail },
    { type: 'webhook', label: 'Webhook', icon: Globe },
  ],
  'Feedback': [
    { type: 'feedback', label: 'Collect Feedback', icon: MessageSquare },
    { type: 'rating', label: 'Rating', icon: MessageSquare },
  ],
  'Human': [
    { type: 'transferToAgent', label: 'Transfer to Agent', icon: UserPlus },
  ],
  'Premium': [
    { type: 'booking', label: 'Booking', icon: Calendar },
    { type: 'makeCall', label: 'Make Call', icon: Phone },
    { type: 'humanHandoff', label: 'Human Handoff', icon: UserCheck },
    { type: 'zapierWebhook', label: 'Zapier', icon: Zap },
    { type: 'crmUpdate', label: 'CRM Update', icon: Database },
  ]
};

const defaultNodes: Node[] = [
  { 
    id: 'start', 
    type: 'start',
    position: { x: 100, y: 200 }, 
    data: { label: 'Start', message: 'Hello! How can I help you today?' },
    draggable: false
  }
];

export default function FlowBuilder() {
  const navigate = useNavigate();
  const { currentChatbot, setFlowData } = useChatbotStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggingType, setDraggingType] = useState<string | null>(null);

  const nodeTypes: NodeTypes = {
    start: (props) => <CustomNode {...props} type="start" />,
    aiResponse: (props) => <CustomNode {...props} type="aiResponse" />,
    intentDetection: (props) => <CustomNode {...props} type="intentDetection" />,
    sentimentAnalysis: (props) => <CustomNode {...props} type="sentimentAnalysis" />,
    textInput: (props) => <CustomNode {...props} type="textInput" />,
    yesNoInput: (props) => <CustomNode {...props} type="yesNoInput" />,
    choiceInput: (props) => <CustomNode {...props} type="choiceInput" />,
    emailInput: (props) => <CustomNode {...props} type="emailInput" />,
    phoneInput: (props) => <CustomNode {...props} type="phoneInput" />,
    condition: (props) => <CustomNode {...props} type="condition" />,
    feedback: (props) => <CustomNode {...props} type="feedback" />,
    rating: (props) => <CustomNode {...props} type="rating" />,
    branch: (props) => <CustomNode {...props} type="branch" />,
    delay: (props) => <CustomNode {...props} type="delay" />,
    sendEmail: (props) => <CustomNode {...props} type="sendEmail" />,
    webhook: (props) => <CustomNode {...props} type="webhook" />,
    transferToAgent: (props) => <CustomNode {...props} type="transferToAgent" />,
    end: (props) => <CustomNode {...props} type="end" />,
    booking: (props) => <CustomNode {...props} type="booking" />,
    makeCall: (props) => <CustomNode {...props} type="makeCall" />,
    humanHandoff: (props) => <CustomNode {...props} type="humanHandoff" />,
    zapierWebhook: (props) => <CustomNode {...props} type="zapierWebhook" />,
    crmUpdate: (props) => <CustomNode {...props} type="crmUpdate" />,
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, id: `e${Date.now()}` }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowSettings(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowSettings(false);
  }, []);

  const onDragStart = (e: React.DragEvent, type: string) => {
    setDraggingType(type);
    e.dataTransfer.setData('application/react-flow/type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDraggingType(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-flow/type');
    if (!type) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - bounds.left - 100,
      y: e.clientY - bounds.top - 50
    };

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        label: nodeCategories['AI/ML'].find(n => n.type === type)?.label ||
               nodeCategories['Input'].find(n => n.type === type)?.label ||
               nodeCategories['Logic'].find(n => n.type === type)?.label ||
               nodeCategories['Action'].find(n => n.type === type)?.label ||
               nodeCategories['Human'].find(n => n.type === type)?.label ||
               nodeCategories['Premium'].find(n => n.type === type)?.label || type,
        message: '',
        condition: '',
        delay: 1000,
        webhookUrl: '',
        emailTo: '',
        emailSubject: '',
        emailBody: ''
      }
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const updateNodeData = (id: string, data: Record<string, unknown>) => {
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, data: { ...node.data, ...data } } : node
    ));
  };

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNode(null);
    setShowSettings(false);
  };

  const addEdgeBetween = () => {
    if (!selectedNode) return;
    const newNode: Node = {
      id: `end-${Date.now()}`,
      type: 'end',
      position: { x: selectedNode.position.x + 200, y: selectedNode.position.y + 100 },
      data: { label: 'End', message: 'Thank you for chatting!' }
    };
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [
      ...eds,
      { id: `e${Date.now()}`, source: selectedNode.id, target: newNode.id }
    ]);
  };

  const saveFlow = () => {
    const flow = { nodes: nodes as Node[], edges: edges as Edge[] };
    setFlowData(flow as any);
    navigate('/preview');
  };

  return (
    <div className="h-screen bg-slate-900 flex">
      {sidebarOpen && (
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Node Types</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {Object.entries(nodeCategories).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type)}
                      onDragEnd={onDragEnd}
                      className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg cursor-grab hover:bg-slate-600 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-cyan-400" />
                      <span className="text-white text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-semibold text-white">{currentChatbot?.name || 'Flow Builder'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={saveFlow}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save & Test
            </button>
          </div>
        </nav>

        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-900"
          >
            <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />
            <MiniMap 
              className="!bg-slate-800 !border-slate-700"
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  start: '#10b981',
                  aiResponse: '#06b6d4',
                  intentDetection: '#8b5cf6',
                  textInput: '#f59e0b',
                  condition: '#ec4899',
                  end: '#ef4444'
                };
                return colors[node.type || ''] || '#64748b';
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            <Panel position="top-right" className="!top-4 !right-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={addEdgeBetween}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add End Node
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {showSettings && selectedNode && (
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Node Settings</h2>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-slate-400 mb-2">Label</label>
              <input
                type="text"
                value={(selectedNode.data as any)?.label || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            
            {selectedNode.type === 'aiResponse' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">AI Response Message</label>
                  <textarea
                    value={(selectedNode.data as any)?.message || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="Enter the AI response..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Use AI (Dynamic)</label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-white">Enable AI generation</span>
                  </label>
                </div>
              </>
            )}

            {selectedNode.type === 'emailInput' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Email Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Please enter your email"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Error Message</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.errorMessage || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { errorMessage: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Please enter a valid email"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'phoneInput' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Phone Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Please enter your phone number"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Format</label>
                  <select
                    value={(selectedNode.data as any)?.phoneFormat || 'any'}
                    onChange={(e) => updateNodeData(selectedNode.id, { phoneFormat: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="any">Any</option>
                    <option value="india">India (+91)</option>
                    <option value="us">US (+1)</option>
                    <option value="international">International</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'yesNoInput' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Are you satisfied?"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Yes Label</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.yesLabel || 'Yes'}
                    onChange={(e) => updateNodeData(selectedNode.id, { yesLabel: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">No Label</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.noLabel || 'No'}
                    onChange={(e) => updateNodeData(selectedNode.id, { noLabel: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'choiceInput' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Select an option"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Options (one per line)</label>
                  <textarea
                    value={(selectedNode.data as any)?.choices || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { choices: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 h-24"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'rating' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Rate your experience (1-5)"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Max Stars</label>
                  <select
                    value={(selectedNode.data as any)?.maxRating || 5}
                    onChange={(e) => updateNodeData(selectedNode.id, { maxRating: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="3">3 Stars</option>
                    <option value="5">5 Stars</option>
                    <option value="10">10 Stars</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'feedback' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Feedback Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Any other feedback?"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Placeholder</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.placeholder || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { placeholder: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Type your feedback here..."
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'textInput' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Input Question</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.question || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { question: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="What would you like to ask?"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Input Type</label>
                  <select
                    value={(selectedNode.data as any)?.inputType || 'text'}
                    onChange={(e) => updateNodeData(selectedNode.id, { inputType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="yesno">Yes/No</option>
                    <option value="choice">Choice (Dropdown)</option>
                  </select>
                </div>
                {(selectedNode.data as any)?.inputType === 'choice' && (
                  <div className="mt-3">
                    <label className="block text-slate-400 mb-2">Options (comma separated)</label>
                    <input
                      type="text"
                      value={(selectedNode.data as any)?.choices || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { choices: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'condition' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Variable/Field</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.variable || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { variable: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="user.input"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Condition Type</label>
                  <select
                    value={(selectedNode.data as any)?.conditionType || 'equals'}
                    onChange={(e) => updateNodeData(selectedNode.id, { conditionType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="equals">Equals (=)</option>
                    <option value="notEquals">Not Equals (!=)</option>
                    <option value="contains">Contains</option>
                    <option value="greaterThan">Greater Than (gt)</option>
                    <option value="lessThan">Less Than (lt)</option>
                    <option value="isEmpty">Is Empty</option>
                    <option value="isNotEmpty">Is Not Empty</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Value to Compare</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.conditionValue || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { conditionValue: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="yes"
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'delay' && (
              <div>
                <label className="block text-slate-400 mb-2">Delay (ms)</label>
                <input
                  type="number"
                  value={(selectedNode.data as any)?.delay || 1000}
                  onChange={(e) => updateNodeData(selectedNode.id, { delay: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {selectedNode.type === 'webhook' && (
              <div>
                <label className="block text-slate-400 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={(selectedNode.data as any)?.webhookUrl || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { webhookUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="https://..."
                />
              </div>
            )}

            {selectedNode.type === 'sendEmail' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2">Send To</label>
                  <select
                    value={(selectedNode.data as any)?.sendToType || 'fixed'}
                    onChange={(e) => updateNodeData(selectedNode.id, { sendToType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fixed">Fixed Email</option>
                    <option value="user">User's Email (from input)</option>
                  </select>
                </div>
                {(selectedNode.data as any)?.sendToType !== 'user' && (
                  <div className="mt-3">
                    <label className="block text-slate-400 mb-2">To Email</label>
                    <input
                      type="email"
                      value={(selectedNode.data as any)?.emailTo || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { emailTo: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="recipient@example.com"
                    />
                  </div>
                )}
                {(selectedNode.data as any)?.sendToType === 'user' && (
                  <div className="mt-3">
                    <label className="block text-slate-400 mb-2">Email Field</label>
                    <input
                      type="text"
                      value={(selectedNode.data as any)?.emailField || 'user.email'}
                      onChange={(e) => updateNodeData(selectedNode.id, { emailField: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="user.email"
                    />
                  </div>
                )}
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.emailSubject || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { emailSubject: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Subject line"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-slate-400 mb-2">Body</label>
                  <textarea
                    value={(selectedNode.data as any)?.emailBody || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { emailBody: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </>
            )}

            <button 
              onClick={() => deleteNode(selectedNode.id)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}