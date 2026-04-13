import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  Panel,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Save, Play, Download, Upload, 
  Settings, Plus, Trash2, Loader2, MessageSquare, GitBranch, 
  Clock, Zap, Mail, Phone, Globe, UserPlus, Calendar, UserCheck, Database,
  Maximize2, Minimize2, Copy, Undo2, Redo2, Layers, Search, Moon, Sun,
  Share2, Grid3X3, Eye, EyeOff, AlertCircle, CheckCircle, Languages,
  Palette, HelpCircle, X, Wand2
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

const nodeColors: Record<string, string> = {
  start: 'bg-green-500',
  aiResponse: 'bg-cyan-500',
  intentDetection: 'bg-purple-500',
  sentimentAnalysis: 'bg-purple-500',
  textInput: 'bg-amber-500',
  yesNoInput: 'bg-amber-500',
  choiceInput: 'bg-amber-500',
  emailInput: 'bg-amber-500',
  phoneInput: 'bg-amber-500',
  condition: 'bg-pink-500',
  branch: 'bg-pink-500',
  delay: 'bg-orange-500',
  sendEmail: 'bg-blue-500',
  webhook: 'bg-blue-500',
  transferToAgent: 'bg-red-500',
  feedback: 'bg-indigo-500',
  rating: 'bg-indigo-500',
  end: 'bg-red-500',
  booking: 'bg-yellow-500',
  makeCall: 'bg-red-500',
  humanHandoff: 'bg-red-500',
  zapierWebhook: 'bg-orange-500',
  crmUpdate: 'bg-blue-500',
};

export default function FlowBuilder() {
  const navigate = useNavigate();
  const { currentChatbot, user, setFlowData, saveDraft, publishBot } = useChatbotStore();
  const isPro = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'enterprise';
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  React.useEffect(() => {
    if (currentChatbot?.flow?.nodes?.length) {
      setNodes(currentChatbot.flow.nodes as any);
      setEdges(currentChatbot.flow.edges as any);
    }
  }, [currentChatbot, setNodes, setEdges]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nodeSearch, setNodeSearch] = useState('');
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [isWireframeMode, setIsWireframeMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [exporting, setExporting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customTheme, setCustomTheme] = useState<Record<string, string>>({});
  const [errorBanner, setErrorBanner] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const clipboardRef = useRef<Node[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const saveToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) });
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const copyNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      const nodesToCopy = nodes.filter(n => selectedNodes.includes(n.id));
      clipboardRef.current = JSON.parse(JSON.stringify(nodesToCopy));
    }
  }, [nodes, selectedNodes]);

  const pasteNodes = useCallback(() => {
    if (clipboardRef.current.length > 0) {
      const offset = { x: 50, y: 50 };
      const newNodes = clipboardRef.current.map(node => ({
        ...node,
        id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: { x: node.position.x + offset.x, y: node.position.y + offset.y }
      }));
      setNodes(nds => [...nds, ...newNodes]);
      saveToHistory([...nodes, ...newNodes], edges);
    }
  }, [nodes, edges, setNodes, saveToHistory]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copyNodes();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteNodes();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedNodes(nodes.map(n => n.id));
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.length > 0 && !showSettings && !showShareModal && !showOnboarding && !showColorPicker) {
          setNodes(nds => nds.filter(n => !selectedNodes.includes(n.id)));
          setEdges(eds => eds.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
          setSelectedNodes([]);
          saveToHistory(nodes.filter(n => !selectedNodes.includes(n.id)), edges);
        }
      }
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
        if (showShareModal) setShowShareModal(false);
        if (showOnboarding) setShowOnboarding(false);
        if (showColorPicker) setShowColorPicker(false);
        if (showSettings) setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copyNodes, pasteNodes, isFullscreen, selectedNodes, nodes, edges, showSettings, showShareModal, showOnboarding, showColorPicker, setNodes, setEdges, saveToHistory]);

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
    saveToHistory([...nodes, newNode], edges);
  }, [setNodes, nodes, edges, saveToHistory]);

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
    <ReactFlowProvider>
      <div className="h-screen bg-slate-900 flex flex-col md:flex-row">
        {sidebarOpen && (
          <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0 max-md:hidden" role="region" aria-label="Node types sidebar">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-3">Node Types</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={nodeSearch}
                  onChange={(e) => setNodeSearch(e.target.value)}
                  placeholder="Search nodes..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.entries(nodeCategories).map(([category, items]) => {
                const filteredItems = items.filter(item => 
                  item.label.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                  item.type.toLowerCase().includes(nodeSearch.toLowerCase())
                );
                if (filteredItems.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">{category}</h3>
                    <div className="space-y-2">
                      {filteredItems.map((item) => {
                      const isPremium = category === 'Premium';
                      return (
                        <div
                          key={item.type}
                          draggable={!isPremium || isPro}
                          onDragStart={(e) => !isPremium || isPro ? onDragStart(e, item.type) : undefined}
                          onDragEnd={onDragEnd}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-grab transition-colors",
                            isPremium && !isPro ? "bg-slate-800/50 cursor-not-allowed opacity-50" : "bg-slate-700 hover:bg-slate-600"
                          )}
                          role="button"
                          aria-label={`${item.label} node`}
                          aria-disabled={isPremium && !isPro}
                        >
                          <item.icon className={cn("w-4 h-4", isPremium && !isPro ? "text-slate-500" : "text-cyan-400")} />
                          <span className={cn("text-sm truncate", isPremium && !isPro ? "text-slate-500" : "text-white")}>{item.label}</span>
                          {isPremium && !isPro && <span className="ml-auto text-xs text-slate-500">PRO</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
            {/* Core Actions - Always Available */}
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-5 h-5" />
            </button>
            
            {/* View Options */}
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            
            {/* Premium Features - Redirect to pricing if not paid */}
            <button 
              onClick={() => {
                if (user?.subscription?.tier === 'free') {
                  navigate('/pricing');
                  return;
                }
                setShowShareModal(true);
              }}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={user?.subscription?.tier === 'free' ? "Upgrade to Share" : "Share"}
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => {
                if (user?.subscription?.tier === 'free') {
                  navigate('/pricing');
                  return;
                }
                if (nodes.length < 2) {
                  alert('Add nodes to export');
                  return;
                }
                setExporting(true);
                setTimeout(() => setExporting(false), 1500);
              }}
              disabled={exporting}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title={user?.subscription?.tier === 'free' ? "Upgrade to Export" : "Export"}
            >
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-700 mx-2" />
            
            {/* Save Actions */}
            <button 
              onClick={() => {
                saveFlow();
                // Save as draft
                if (currentChatbot?.id) {
                  saveDraft(currentChatbot.id);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            
            <button 
              onClick={() => {
                saveFlow();
                // Publish the bot
                if (currentChatbot?.id) {
                  publishBot(currentChatbot.id);
                  alert('Bot published successfully!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Publish
            </button>
          </div>
        </nav>

        <div 
          className="flex-1 relative" 
          ref={containerRef}
          onDrop={onDrop} 
          onDragOver={onDragOver}
          role="application"
          aria-label="Flow canvas"
        >
          {nodes.length <= 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center p-8 bg-slate-800/80 rounded-xl backdrop-blur-sm border border-slate-700/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <GitBranch className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Start Building Your Flow</h3>
                <p className="text-slate-400 mb-4">Drag nodes from the sidebar to create your chatbot flow</p>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-slate-700 rounded-full text-slate-300">Drag & Drop</span>
                  <span className="px-3 py-1 bg-slate-700 rounded-full text-slate-300">Click to Connect</span>
                  <span className="px-3 py-1 bg-slate-700 rounded-full text-slate-300">Ctrl+Z to Undo</span>
                </div>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onSelectionChange={({ nodes: selected }) => setSelectedNodes(selected.map(n => n.id))}
            onNodesDelete={(deletedNodes) => {
              // Sync with database when nodes are deleted
              if (currentChatbot?.id && deletedNodes.length > 0) {
                const remainingNodes = nodes.filter(n => !deletedNodes.some(dn => dn.id === n.id));
                const remainingEdges = edges.filter(e => 
                  !deletedNodes.some(dn => dn.id === e.source || dn.id === e.target)
                );
                setFlowData({ nodes: remainingNodes as any, edges: remainingEdges as any });
              }
            }}
            nodeTypes={nodeTypes}
            fitView
            className={cn("transition-all duration-200", isWireframeMode ? "opacity-60" : "")}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            proOptions={{ hideAttribution: true }}
            snapToGrid={snapToGrid}
            snapGrid={[gridSize, gridSize]}
          >
            <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1} color={isDarkMode ? "#334155" : "#94a3b8"} />
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

      {showLayersPanel && (
        <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Layers</h2>
            <button onClick={() => setShowLayersPanel(false)} className="p-1 hover:bg-slate-700 rounded">
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {nodes.slice().reverse().map((node, index) => (
              <div 
                key={node.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedNodes.includes(node.id) ? "bg-cyan-500/20" : "hover:bg-slate-700"
                )}
                onClick={() => {
                  setSelectedNodes([node.id]);
                  setSelectedNode(node);
                  setShowSettings(true);
                }}
              >
                <span className="text-xs text-slate-500 w-6">{nodes.length - index}</span>
                <div className={cn("w-3 h-3 rounded-full", nodeColors[node.type || ''] || "bg-slate-500")} />
                <span className="text-sm text-white truncate flex-1">{node.data.label as string || node.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Share Flow</h2>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-slate-700 rounded-lg">
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <div className="text-xs text-slate-500 mb-2">Preview</div>
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">{nodes.length} nodes, {edges.length} connections</div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-slate-400 mb-2">Share Link</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://flowvibe.app/share/${Date.now()}`}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`https://flowvibe.app/share/${Date.now()}`)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Link expires in 30 days
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  const link = `https://flowvibe.app/share/${Date.now()}`;
                  window.open(link, '_blank');
                }}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium"
              >
                Open Link
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowOnboarding(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-cyan-400" />
                Welcome to FlowVibe
              </h2>
              <button onClick={() => setShowOnboarding(false)} className="p-1 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Quick Start</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <span>Drag nodes from sidebar to create your flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <span>Click nodes to configure their settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400 mt-0.5" />
                    <span>Connect nodes by dragging from handles</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Undo</span><kbd className="px-2 py-0.5 bg-slate-700 rounded text-white">Ctrl+Z</kbd></div>
                  <div className="flex justify-between"><span className="text-slate-400">Redo</span><kbd className="px-2 py-0.5 bg-slate-700 rounded text-white">Ctrl+Y</kbd></div>
                  <div className="flex justify-between"><span className="text-slate-400">Copy</span><kbd className="px-2 py-0.5 bg-slate-700 rounded text-white">Ctrl+C</kbd></div>
                  <div className="flex justify-between"><span className="text-slate-400">Paste</span><kbd className="px-2 py-0.5 bg-slate-700 rounded text-white">Ctrl+V</kbd></div>
                  <div className="flex justify-between"><span className="text-slate-400">Delete</span><kbd className="px-2 py-0.5 bg-slate-700 rounded text-white">Del</kbd></div>
                  <div className="flex justify-between"><span className="text-slate-400">Select All</span><kbd className="px-2 py-0.5 bg-slate-700 rounded text-white">Ctrl+A</kbd></div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Pro Tips</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Use <kbd className="px-1 py-0.5 bg-slate-700 rounded text-white text-xs">Ctrl+Z</kbd> to undo mistakes</li>
                  <li>Toggle <kbd className="px-1 py-0.5 bg-slate-700 rounded text-white text-xs">Grid</kbd> for precise alignment</li>
                  <li>Use <kbd className="px-1 py-0.5 bg-slate-700 rounded text-white text-xs">Layers</kbd> to reorder nodes</li>
                  <li>Switch to <kbd className="px-1 py-0.5 bg-slate-700 rounded text-white text-xs">Wireframe</kbd> for cleaner view</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowOnboarding(false)}
              className="mt-4 w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {showColorPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowColorPicker(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-80 max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Customize Theme</h2>
              <button onClick={() => setShowColorPicker(false)} className="p-1 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-2 text-sm">Accent Color</label>
                <div className="flex gap-2 flex-wrap">
                  {['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setCustomTheme({ accent: color })}
                      className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-2 text-sm">Background</label>
                <div className="flex gap-2">
                  <button onClick={() => setCustomTheme({ ...customTheme, bg: 'slate-900' })} className="px-3 py-2 bg-slate-900 rounded text-white text-sm">Dark</button>
                  <button onClick={() => setCustomTheme({ ...customTheme, bg: 'gray-100' })} className="px-3 py-2 bg-gray-100 rounded text-slate-900 text-sm">Light</button>
                  <button onClick={() => setCustomTheme({ ...customTheme, bg: 'blue-950' })} className="px-3 py-2 bg-blue-950 rounded text-blue-200 text-sm">Midnight</button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-2 text-sm">Grid Size</label>
                <input 
                  type="range" 
                  min="10" 
                  max="50" 
                  value={gridSize}
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-slate-500 text-right">{gridSize}px</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => { setCustomTheme({}); setGridSize(20); setShowColorPicker(false); }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowColorPicker(false)}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {errorBanner && (
        <div className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300",
          errorBanner.type === 'error' ? "bg-red-500/90 text-white" : "bg-green-500/90 text-white"
        )}>
          {errorBanner.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{errorBanner.message}</span>
          <button onClick={() => setErrorBanner(null)} className="ml-2 hover:bg-white/20 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
    </ReactFlowProvider>
  );
}