
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EvaluationStats {
  averageRating: number;
  totalEvaluations: number;
  topTags: { name: string; count: number }[];
  ratingDistribution: Record<number, number>;
}

export const useEvaluationStats = (interviewerId: string | undefined) => {
  const [stats, setStats] = useState<EvaluationStats>({
    averageRating: 0,
    totalEvaluations: 0,
    topTags: [],
    ratingDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!interviewerId) return;
    
    const calculateStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all evaluations for this interviewer
        const { data: evaluations, error: evalError } = await supabase
          .from('interviewer_evaluations')
          .select('*')
          .eq('interviewer_id', interviewerId);
          
        if (evalError) throw evalError;
        
        // If no evaluations, return default stats
        if (!evaluations || evaluations.length === 0) {
          setStats({
            averageRating: 0,
            totalEvaluations: 0,
            topTags: [],
            ratingDistribution: {}
          });
          setLoading(false);
          return;
        }
        
        // Calculate average rating
        const sum = evaluations.reduce((acc, eval_) => acc + eval_.rating, 0);
        const average = sum / evaluations.length;
        
        // Calculate rating distribution
        const distribution: Record<number, number> = {};
        evaluations.forEach(eval_ => {
          distribution[eval_.rating] = (distribution[eval_.rating] || 0) + 1;
        });
        
        // Fetch all tags for these evaluations
        const evaluationIds = evaluations.map(e => e.id);
        
        const { data: tagsJunction, error: tagsError } = await supabase
          .from('evaluation_tags_junction')
          .select(`
            tag_id,
            evaluation_tags:tag_id (
              name
            )
          `)
          .in('evaluation_id', evaluationIds as string[]);
          
        if (tagsError) throw tagsError;
        
        // Count tag occurrences
        const tagCounts: Record<string, { name: string; count: number }> = {};
        
        tagsJunction?.forEach((junction: any) => {
          if (junction.evaluation_tags && junction.evaluation_tags.name) {
            const tagName = junction.evaluation_tags.name;
            if (!tagCounts[tagName]) {
              tagCounts[tagName] = { name: tagName, count: 0 };
            }
            tagCounts[tagName].count += 1;
          }
        });
        
        // Get top tags
        const sortedTags = Object.values(tagCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setStats({
          averageRating: parseFloat(average.toFixed(1)),
          totalEvaluations: evaluations.length,
          topTags: sortedTags,
          ratingDistribution: distribution
        });
        
      } catch (err) {
        console.error("Error calculating evaluation stats:", err);
        setError("Failed to load evaluation statistics");
      } finally {
        setLoading(false);
      }
    };
    
    calculateStats();
  }, [interviewerId]);
  
  return { stats, loading, error };
};
