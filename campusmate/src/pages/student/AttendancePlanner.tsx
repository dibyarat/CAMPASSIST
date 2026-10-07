import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const AttendancePlanner = () => {
  const [attended, setAttended] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [target, setTarget] = useState<number>(75);
  const [loading, setLoading] = useState(true);

  // Results
  const [currentPercent, setCurrentPercent] = useState<number>(0);
  const [canMiss, setCanMiss] = useState<number>(0);
  const [needToAttend, setNeedToAttend] = useState<number>(0);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const stats = await apiClient('/attendance/my-attendance');
        setAttended(stats.overallAttended || 0);
        setTotal(stats.overallTotal || 0);
        setCurrentPercent(stats.overallPercentage || 0);
      } catch (error) {
        console.error("Failed to load attendance stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const calculate = () => {
    const current = (attended / total) * 100;
    setCurrentPercent(current || 0);

    const targetDec = target / 100;

    // To find how many can miss: 
    // attended / (total + x) = targetDec => attended = targetDec * total + targetDec * x => x = (attended - targetDec * total) / targetDec
    let miss = Math.floor((attended - targetDec * total) / targetDec);
    if (miss < 0) miss = 0;
    
    // To find how many need to attend:
    // (attended + y) / (total + y) = targetDec => attended + y = targetDec * total + targetDec * y => y * (1 - targetDec) = targetDec * total - attended
    let attend = Math.ceil((targetDec * total - attended) / (1 - targetDec));
    if (attend < 0) attend = 0;

    setCanMiss(miss);
    setNeedToAttend(attend);
    setCalculated(true);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Attendance Planner</h1>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Current Attended Classes</label>
                <input 
                  type="number" 
                  value={attended} 
                  onChange={(e) => setAttended(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Current Total Classes</label>
                <input 
                  type="number" 
                  value={total} 
                  onChange={(e) => setTotal(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Target Attendance (%)</label>
                <input 
                  type="number" 
                  value={target} 
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            
            <div className="flex justify-center mb-12">
              <button 
                onClick={calculate}
                className="px-12 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition"
              >
                Calculate
              </button>
            </div>

            {calculated && (
              <div className="border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-slate-900 mb-6">Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center">
                    <h2 className={`text-4xl font-extrabold mb-2 ${currentPercent >= target ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {currentPercent.toFixed(2)}%
                    </h2>
                    <p className="text-sm font-medium text-slate-500">Current Attendance</p>
                  </div>
                  
                  <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0">
                    <p className="text-sm text-slate-600 mb-1">You can miss</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      <span className="text-blue-600">{canMiss}</span> more classes
                    </h3>
                    <p className="text-xs text-slate-500">and still maintain {target}%</p>
                  </div>
                  
                  <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0">
                    <p className="text-sm text-slate-600 mb-1">You need to attend</p>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      at least <span className="text-rose-500">{needToAttend}</span> classes
                    </h3>
                    <p className="text-xs text-slate-500">to reach {target}%</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
