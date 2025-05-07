
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { Loader2 } from 'lucide-react';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewerId: string;
  interviewerName: string;
  onSubmit: (score: number, comment?: string) => Promise<boolean>;
  loading: boolean;
}

export function RatingDialog({
  open,
  onOpenChange,
  interviewerId,
  interviewerName,
  onSubmit,
  loading
}: RatingDialogProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (score === 0) return;
    
    const success = await onSubmit(score, comment);
    if (success) {
      setScore(0);
      setComment('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Interviewer: {interviewerName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex justify-center p-2">
              <StarRating
                rating={score}
                onRate={setScore}
                size={32}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {score > 0 ? `${score} out of 5 stars` : 'Select a rating'}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">Comments (Optional)</label>
            <Textarea
              id="comment"
              placeholder="Add any additional feedback about this interviewer..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={score === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
