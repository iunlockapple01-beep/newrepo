"use client";

import { useState, useTransition } from "react";
import type { AnalyzeHtmlForImprovementsOutput } from "@/ai/flows/analyze-html-for-improvements";
import { analyzeHtml, fixHtml } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Accessibility, Link2Off, ImageOff, CodeXml, Download, CheckCircle, FileCode, Bot, Sparkles, BrainCircuit, Wand2 } from "lucide-react";

type AnalysisCategory = keyof AnalyzeHtmlForImprovementsOutput;

const analysisCategories: Record<AnalysisCategory, { title: string; icon: React.ElementType }> = {
  accessibilityIssues: {
    title: "Accessibility Issues",
    icon: Accessibility,
  },
  brokenLinks: {
    title: "Broken Links",
    icon: Link2Off,
  },
  missingAltText: {
    title: "Missing Alt Text",
    icon: ImageOff,
  },
  semanticHtmlSuggestions: {
    title: "Semantic HTML",
    icon: CodeXml,
  },
};

const placeholderHtml = `<!DOCTYPE html>
<html>
<head>
  <title>My Test Page</title>
</head>
<body>
  <h1>Welcome!</h1>
  <p>This is a paragraph.</p>
  <div>
    <p>This is inside a div.</p>
  </div>
  <img src="image.jpg">
  <a href="/broken-link">Click me</a>
</body>
</html>`;

export default function Home() {
  const [htmlCode, setHtmlCode] = useState(placeholderHtml);
  const [analysis, setAnalysis] = useState<AnalyzeHtmlForImprovementsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isFixing, startFixing] = useTransition();
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!htmlCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "HTML code cannot be empty.",
      });
      return;
    }
    startAnalyzing(async () => {
      const result = await analyzeHtml(htmlCode);
      if (result) {
        setAnalysis(result);
        toast({
          title: "Analysis Complete",
          description: "We've analyzed your HTML and found some areas for improvement.",
        });
      } else {
        setAnalysis(null);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "Something went wrong. Please try again later.",
        });
      }
    });
  };

  const handleFixCode = () => {
    if (!analysis) return;

    const allSuggestions = Object.values(analysis).flat();
    if(allSuggestions.length === 0) {
      toast({
        title: "No issues to fix!",
        description: "Your code is already looking great.",
      });
      return;
    }

    startFixing(async () => {
      const result = await fixHtml({ htmlCode, suggestions: allSuggestions });
      if (result && result.fixedHtmlCode) {
        setHtmlCode(result.fixedHtmlCode);
        setAnalysis(null); // Clear analysis to prompt re-analysis
        toast({
          title: "Code Fixed!",
          description: "We've applied the suggestions to your code. You can analyze it again to see the changes.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Fix Failed",
          description: "Could not apply the fixes. Please try again later.",
        });
      }
    });
  }
  
  const handleDownload = () => {
    try {
      const blob = new Blob([htmlCode], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "enhanced.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not prepare the file for download.",
      });
    }
  };

  const isPending = isAnalyzing || isFixing;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="p-4 border-b bg-background">
        <div className="container mx-auto flex items-center gap-4">
          <Logo />
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
             <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCode className="w-6 h-6"/>
                        Your HTML Code
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex">
                    <Textarea
                    placeholder="Paste your HTML code here..."
                    className="h-full min-h-[500px] font-code text-sm bg-card flex-1"
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    aria-label="HTML Code Input"
                    />
                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-2">
                    <Button onClick={handleAnalyze} disabled={isPending} className="w-full sm:w-auto">
                      {isAnalyzing ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="mr-2 h-4 w-4" />
                          Analyze Code
                        </>
                      )}
                    </Button>
                    <Button onClick={handleDownload} variant="secondary" className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Download Code
                    </Button>
                </CardFooter>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {isAnalyzing ? (
              <AnalysisSkeleton />
            ) : analysis ? (
              <AnalysisResults analysis={analysis} onFixCode={handleFixCode} isFixing={isFixing} />
            ) : (
              <InitialState />
            )}
          </div>
        </div>
      </main>
      <footer className="p-4 border-t text-center text-sm text-muted-foreground bg-background">
        <p>Powered by AI. Built with Next.js and Firebase.</p>
      </footer>
    </div>
  );
}

function AnalysisResults({ analysis, onFixCode, isFixing }: { analysis: AnalyzeHtmlForImprovementsOutput; onFixCode: () => void; isFixing: boolean }) {
  const analysisKeys = Object.keys(analysis) as AnalysisCategory[];
  const totalIssues = analysisKeys.reduce((acc, key) => acc + analysis[key].length, 0);

  return (
     <div className="space-y-4">
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-6 h-6" />
                    Analysis Results
                </CardTitle>
                <Button onClick={onFixCode} disabled={isFixing || totalIssues === 0} size="sm">
                  {isFixing ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Applying Fixes...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Fix It For Me
                    </>
                  )}
                </Button>
            </CardHeader>
        </Card>
        {analysisKeys.map((key) => {
            const category = analysisCategories[key];
            const suggestions = analysis[key];
            const Icon = category.icon;

            return (
            <Card key={key}>
                <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-primary" />
                    <span>{category.title}</span>
                    <span className="ml-auto text-sm font-medium rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                        {suggestions.length} found
                    </span>
                </CardTitle>
                </CardHeader>
                <CardContent>
                {suggestions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                    {suggestions.map((suggestion, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>Suggestion #{index + 1}</AccordionTrigger>
                        <AccordionContent className="font-code text-sm">
                            <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md">{suggestion}</pre>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                ) : (
                    <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-md border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <p className="font-medium">No issues found in this category. Great job!</p>
                    </div>
                )}
                </CardContent>
            </Card>
            );
        })}
     </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                     <Skeleton className="h-6 w-48" />
                </CardTitle>
            </CardHeader>
        </Card>
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InitialState() {
  return (
    <Card className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 border-dashed bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full">
            <Bot className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Ready to Analyze</h2>
        <p className="text-muted-foreground max-w-sm">
          Paste your HTML code on the left and click 'Analyze Code' to get AI-powered insights and suggestions for improvement.
        </p>
      </div>
    </Card>
  );
}
