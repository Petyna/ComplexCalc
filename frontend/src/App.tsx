import React, { useState } from 'react';

// Додали 'real' (дійсне) та 'imaginary' (уявне)
type TokenType = 'complex' | 'real' | 'imaginary' | 'operator' | 'paren_open' | 'paren_close' | 'power';

interface TokenData {
  id: string;
  type: TokenType;
  value?: string;
  re?: string;
  im?: string;
}

// Міні-інпут для цифр із жорстко заданим чорним кольором
const MiniInput = ({ value, onChange, placeholder, isPower = false }: any) => (
  <input
    type="text"
    value={value}
    onChange={(e) => {
      const val = e.target.value;
      if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) onChange(val);
    }}
    placeholder={placeholder}
    style={{
      width: isPower ? '35px' : '50px', 
      padding: isPower ? '4px' : '6px', 
      textAlign: 'center', 
      borderRadius: '4px', 
      border: '1px solid #cbd5e1', 
      outline: 'none', 
      fontWeight: 'bold', 
      fontSize: isPower ? '0.9rem' : '1.1rem',
      backgroundColor: '#fff',
      color: '#000000', // ЗАВЖДИ ЧОРНИЙ КОЛІР ЦИФР
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
    }}
    onFocus={(e) => e.target.style.borderColor = '#3498db'}
    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
  />
);

const App: React.FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [result, setResult] = useState<{re: number, im: number} | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const addToken = (type: TokenType, value: string = '') => {
    setTokens([...tokens, { id: Date.now().toString() + Math.random(), type, value, re: '0', im: '0' }]);
  };

  const backspace = () => setTokens(tokens.slice(0, -1));
  const clearAll = () => { setTokens([]); setResult(null); };

  const updateToken = (id: string, field: 're' | 'im' | 'value', val: string) => {
    setTokens(tokens.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  const solve = async () => {
    if (tokens.length === 0) return;
    
    const payloadTokens = tokens.map(t => ({
      type: t.type,
      value: t.value || '',
      re: parseFloat(t.re || '0') || 0,
      im: parseFloat(t.im || '0') || 0
    }));

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: payloadTokens }),
      });
      if (!response.ok) throw new Error((await response.json()).detail);
      setResult(await response.json());
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderComplex = (re: number, im: number) => {
    if (re === 0 && im === 0) return <span>0</span>;
    let parts = [];
    if (re !== 0) parts.push(<span key="re">{re}</span>);
    if (im !== 0) {
      const sign = im < 0 ? (parts.length ? ' - ' : '-') : (parts.length ? ' + ' : '');
      const coeff = Math.abs(im) === 1 ? '' : Math.abs(im);
      parts.push(<span key="im" style={{ color: '#e67e22' }}>{sign}{coeff}<i>i</i></span>);
    }
    return <>{parts}</>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '25px' }}>Комплексні та дійсні числа</p>

        {/* ЕКРАН КАЛЬКУЛЯТОРА */}
        <div style={{ 
          minHeight: '120px', backgroundColor: '#f8fafc', border: '2px solid #cbd5e1', 
          borderRadius: '12px', padding: '20px', marginBottom: '20px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', alignContent: 'flex-start', gap: '8px',
          fontSize: '1.5rem', color: '#2c3e50'
        }}>
          {tokens.length === 0 && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Введіть вираз...</span>}
          
          {tokens.map((t) => {
            // Повна дужка (Re + Im i)
            if (t.type === 'complex') {
              return (
                <div key={t.id} style={blockStyle}>
                  <span style={{ color: '#64748b', marginRight: '4px' }}>(</span>
                  <MiniInput value={t.re} onChange={(v: string) => updateToken(t.id, 're', v)} placeholder="Re" />
                  <span style={{ margin: '0 6px', fontWeight: 'bold' }}>+</span>
                  <MiniInput value={t.im} onChange={(v: string) => updateToken(t.id, 'im', v)} placeholder="Im" />
                  <span style={{ marginLeft: '4px', fontStyle: 'italic', color: '#e67e22', fontWeight: 'bold' }}>i</span>
                  <span style={{ color: '#64748b', marginLeft: '4px' }}>)</span>
                </div>
              );
            }
            // Звичайне дійсне число (наприклад, 56)
            if (t.type === 'real') {
              return (
                <div key={t.id} style={blockStyle}>
                  <MiniInput value={t.re} onChange={(v: string) => updateToken(t.id, 're', v)} placeholder="Re" />
                </div>
              );
            }
            // Суто уявне число (наприклад, 8i)
            if (t.type === 'imaginary') {
              return (
                <div key={t.id} style={blockStyle}>
                  <MiniInput value={t.im} onChange={(v: string) => updateToken(t.id, 'im', v)} placeholder="Im" />
                  <span style={{ marginLeft: '4px', fontStyle: 'italic', color: '#e67e22', fontWeight: 'bold' }}>i</span>
                </div>
              );
            }
            // Оператори та дужки
            if (t.type === 'operator') return <span key={t.id} style={{ fontWeight: 'bold', color: '#3498db', margin: '0 5px' }}>{t.value}</span>;
            if (t.type === 'paren_open') return <span key={t.id} style={{ fontWeight: 'bold', color: '#7f8c8d' }}>(</span>;
            if (t.type === 'paren_close') return <span key={t.id} style={{ fontWeight: 'bold', color: '#7f8c8d' }}>)</span>;
            // Степінь
            if (t.type === 'power') {
              return (
                <div key={t.id} style={{ position: 'relative', marginTop: '-20px' }}>
                  <MiniInput value={t.value} onChange={(v: string) => updateToken(t.id, 'value', v)} placeholder="n" isPower={true} />
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* КЛАВІАТУРА (Оновлена сітка на 4 колонки) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          
          <button onClick={() => addToken('complex')} style={{ ...btnStyle, gridColumn: 'span 2', backgroundColor: '#3498db', color: 'white', boxShadow: '0 4px 0 #2980b9' }}>
            [ Re + Im i ] Комплексне
          </button>
          <button onClick={() => addToken('real')} style={{ ...btnStyle, backgroundColor: '#1abc9c', color: 'white', boxShadow: '0 4px 0 #16a085' }}>
            [ Re ] Дійсне
          </button>
          <button onClick={() => addToken('imaginary')} style={{ ...btnStyle, backgroundColor: '#e67e22', color: 'white', boxShadow: '0 4px 0 #d35400' }}>
            [ Im i ] Уявне
          </button>

          <button onClick={() => addToken('paren_open')} style={btnStyle}>( </button>
          <button onClick={() => addToken('paren_close')} style={btnStyle}> )</button>
          <button onClick={() => addToken('operator', '+')} style={opBtnStyle}>+</button>
          <button onClick={() => addToken('operator', '-')} style={opBtnStyle}>-</button>

          <button onClick={() => addToken('power', '2')} style={{...btnStyle, backgroundColor: '#9b59b6', color: 'white', boxShadow: '0 4px 0 #8e44ad'}}>Степінь (xⁿ)</button>
          <button onClick={backspace} style={{...btnStyle, backgroundColor: '#e74c3c', color: 'white', boxShadow: '0 4px 0 #c0392b'}}>⌫ Стерти</button>
          <button onClick={() => addToken('operator', '×')} style={opBtnStyle}>×</button>
          <button onClick={() => addToken('operator', '÷')} style={opBtnStyle}>÷</button>
          
          <button onClick={clearAll} style={{ ...btnStyle, gridColumn: 'span 4', backgroundColor: '#f1f5f9', color: '#e74c3c', border: '2px solid #e74c3c', boxShadow: 'none' }}>
            AC (Очистити все)
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={solve} disabled={loading}
            style={{ width: '100%', padding: '20px', fontSize: '1.5rem', fontWeight: 'bold', color: 'white', backgroundColor: '#27ae60', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 6px 0 #2ecc71', transition: 'all 0.1s' }}
          >
            {loading ? 'Рахуємо...' : '= Обчислити'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e9', border: '2px solid #4caf50', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>Відповідь:</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000000' /* Чорний текст у результаті */ }}>
              {renderComplex(result.re, result.im)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Загальні стилі
const blockStyle = { display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '8px', border: '1px solid #94a3b8' };
const btnStyle = { padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 0 #cbd5e1' };
const opBtnStyle = { padding: '15px', fontSize: '1.5rem', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#2980b9', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 0 #94a3b8' };

export default App;