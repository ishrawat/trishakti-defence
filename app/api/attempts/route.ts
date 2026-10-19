import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { attemptId } = await request.json();

    // Fetch attempt with saved responses and the test data
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: true,
        mockTest: { include: { sections: { include: { questions: true } } } }
      }
    });

    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

    let totalScore = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;
    const sectionResults: any[] = [];
    const topicMap: Record<string, { correct: number, total: number }> = {};

    // Calculate scores based on saved responses
    for (const section of attempt.mockTest.sections) {
      let sectionScore = 0;
      let sectionCorrect = 0;
      let sectionWrong = 0;
      let sectionUnattempted = 0;
      let maxSectionScore = 0;

      for (const q of section.questions) {
        maxSectionScore += q.positiveMarks;
        const savedResponse = attempt.responses.find((r: any) => r.questionId === q.id);
        const selectedOption = savedResponse?.selectedOption;

        if (selectedOption) {
          if (selectedOption === q.correctOption) {
            sectionScore += q.positiveMarks;
            sectionCorrect++;
          } else {
            sectionScore += q.negativeMarks;
            sectionWrong++;
          }
        } else {
          sectionUnattempted++;
        }

        // Topic Analytics
        if (q.topic) {
          if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
          topicMap[q.topic].total += 1;
          if (selectedOption === q.correctOption) topicMap[q.topic].correct += 1;
        }
      }

      totalScore += sectionScore;
      totalCorrect += sectionCorrect;
      totalWrong += sectionWrong;
      totalUnattempted += sectionUnattempted;

      const attemptedInSection = sectionCorrect + sectionWrong;
      sectionResults.push({
        sectionName: section.name,
        score: sectionScore,
        maxScore: maxSectionScore,
        correct: sectionCorrect,
        wrong: sectionWrong,
        unattempted: sectionUnattempted,
        totalQuestions: section.questions.length,
        attempted: attemptedInSection,
        accuracy: attemptedInSection > 0 ? (sectionCorrect / attemptedInSection) * 100 : 0,
        cutoff: section.cutoffMarks,
        isPassed: section.cutoffMarks ? sectionScore >= section.cutoffMarks : true
      });
    }

    const isOverallPassed = attempt.mockTest.overallCutoff ? totalScore >= attempt.mockTest.overallCutoff : true;
    const totalAttempted = totalCorrect + totalWrong;
    const overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

    // Update attempt to COMPLETED
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        totalScore,
        endTime: new Date()
      }
    });

    return NextResponse.json({
      attemptId: attempt.id,
      totalScore,
      overallAccuracy,
      totalCorrect,
      totalWrong,
      totalUnattempted,
      totalAttempted,
      totalQuestions: totalCorrect + totalWrong + totalUnattempted,
      isOverallPassed,
      overallCutoff: attempt.mockTest.overallCutoff,
      sectionResults,
      topicResults: topicMap
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}