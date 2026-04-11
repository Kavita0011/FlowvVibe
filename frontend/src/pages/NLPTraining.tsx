import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, Brain, Plus, Trash2, Save, Check, X, MessageSquare, Zap, AlertCircle } from 'lucide-react';

interface Intent {
  id: string;
  name: string;
  examples: string[];
  response: string;
  entities: string[];
}

export default function NLPTraining() {
  const navigate = useNavigate();
  const { currentChatbot } = useChatbotStore();
  const [intents, setIntents] = useState<Intent[]>([
    { id: '1', name: 'Greeting', examples: ['hello', 'hi', 'hey', 'good morning'], response: 'Hello! How can I help you today?', entities: [] },
    { id: '2', name: 'Pricing', examples: ['how much', 'price', 'cost', 'pricing'], response: 'Our plans start from ₹499/month. Would you like to see the pricing?', entities: [] },
    { id: '3', name: 'Support', examples: ['help', 'issue', 'problem', 'not working'], response: "I'm sorry to hear that. Let me connect you with our support team.", entities: [] },
    { id: '4', name: 'Booking', examples: ['book', 'appointment', 'schedule', 'slot'], response: 'I can help you book an appointment. What service are you interested in?', entities: ['service', 'date', 'time'] }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newIntent, setNewIntent] = useState({ name: '', examples: '', response: '' });
  const [training, setTraining] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleAdd = () => {
    if (newIntent.name && newIntent.examples && newIntent.response) {
      setIntents([...intents, { ...newIntent, id: Date.now().toString(), examples: newIntent.examples.split(',').map(e => e.trim()), entities: [] }]);
      setNewIntent({ name: '', examples: '', response: '' });
      setShowAdd(false);
    }
  };

  const handleDelete = (id: string) => {
    setIntents(intents.filter(i => i.id !== id));
  };

  const handleTrain = async () => {
    setTraining(true);
    setSaveMsg('Training...');
    await new Promise(r => setTimeout(r, 2000));
    setSaveMsg('Saved!');
    setTraining(false);
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handleSave = async () => {
    setSaveMsg('Saving...');
    await new Promise(r => setTimeout(r, 1000));
    setSaveMsg('Changes saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  if (!currentChatbot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Chatbot Selected</h2>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-3 bg-cyan-500 text-white rounded-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" /> NLP Training
            </h1>
            <p className="text-slate-400">Train your chatbot to understand user intents</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className="text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" /> {saveMsg}
              </span>
            )}
            <button onClick={handleTrain} disabled={training} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 disabled:opacity-50">
              <Zap className="w-4 h-4" /> {training ? 'Training...' : 'Train Model'}
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* Intent List */}
        <div className="space-y-4 mb-8">
          {intents.map((intent) => (
            <div key={intent.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{intent.name}</h3>
                  <p className="text-slate-400 text-sm">{intent.examples.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                    {intent.examples.length} examples
                  </span>
                  <button onClick={() => handleDelete(intent.id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-white text-sm">Response: {intent.response}</p>
              </div>
              {intent.entities.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {intent.entities.map((entity, i) => (
                    <span key={i} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                      {entity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Intent */}
        {showAdd ? (
          <div className="bg-slate-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Add New Intent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-2">Intent Name</label>
                <input type="text" value={newIntent.name} onChange={(e) => setNewIntent({ ...newIntent, name: e.target.value })} placeholder="e.g., Pricing, Support" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-2">Training Phrases (comma separated)</label>
                <input type="text" value={newIntent.examples} onChange={(e) => setNewIntent({ ...newIntent, examples: e.target.value })} placeholder="how much does it cost, price, pricing" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-2">Bot Response</label>
                <textarea value={newIntent.response} onChange={(e) => setNewIntent({ ...newIntent, response: e.target.value })} placeholder="Our pricing starts at..." rows={3} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-slate-600 text-white rounded-xl hover:bg-slate-700">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-400">Add Intent</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="w-full py-4 border-2 border-dashed border-slate-700 text-slate-400 rounded-xl hover:border-cyan-500 hover:text-cyan-400 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add Intent
          </button>
        )}

        {/* Tips */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-400 font-medium">Training Tips</h4>
            <ul className="text-slate-400 text-sm space-y-1 mt-2">
              <li>• Add at least 5-10 variations for each intent</li>
              <li>• Include common typos and misspellings</li>
              <li>• Use natural language variations</li>
              <li>• Click "Train Model" after making changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}