import React, { useState, useEffect } from 'react';
import { BarChart2, CheckCircle2, Loader2 } from 'lucide-react';
import { pollService, type ActivePoll } from '../../services/pollService';

export const Polls = () => {
  const [polls, setPolls] = useState<ActivePoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState('');
  const [error, setError] = useState('');

  const fetchPolls = async () => {
    try {
      setError('');
      setPolls(await pollService.listActive());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPolls();
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    setError('');
    try {
      await pollService.vote(pollId, optionId);
      await fetchPolls();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to cast vote.');
    } finally {
      setVotingPollId('');
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Class Polls</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Voice your opinion on class matters.</p>
        </div>
      </div>

      <div className="space-y-6">
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500 w-10 h-10" /></div>
        ) : polls.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-2xl text-center border border-slate-100">
            <p className="text-slate-500">No active polls at the moment.</p>
          </div>
        ) : polls.map((poll) => {
          const isVoted = poll.hasVoted || poll.status === 'CLOSED';
          const totalVotes = poll.options.reduce((acc, opt) => acc + (opt._count?.votes || 0), 0);

          return (
            <div key={poll.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{poll.title}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Posted {new Date(poll.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold border border-purple-100">
                  <BarChart2 size={16} />
                  {totalVotes} Votes
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {poll.options.map((opt) => {
                  const optVotes = opt._count?.votes || 0;
                  const percentage = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100);

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(poll.id, opt.id)}
                      disabled={isVoted || votingPollId === poll.id}
                      className={`w-full relative overflow-hidden rounded-xl border text-left transition-all ${
                        isVoted 
                          ? 'border-slate-200 bg-slate-50 cursor-default' 
                          : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
                      }`}
                    >
                      {/* Progress Bar Background */}
                      {isVoted && (
                        <div 
                          className="absolute inset-y-0 left-0 bg-purple-100/60 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      )}
                      
                      <div className="relative p-4 flex justify-between items-center">
                        <span className={`font-semibold ${isVoted ? 'text-slate-700' : 'text-slate-800'}`}>
                          {opt.text}
                        </span>
                        {isVoted && (
                          <span className="font-bold text-purple-700">{percentage}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {isVoted && (
                <div className="mt-4 flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                  <CheckCircle2 size={16} /> Vote Recorded
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
