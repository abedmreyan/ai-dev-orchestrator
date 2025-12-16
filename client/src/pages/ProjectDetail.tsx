import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { ProposalReview } from "@/components/ProposalReview";
import { ProjectActions } from "@/components/ProjectActions";
import { AttachmentsList } from "@/components/AttachmentsList";
import { FileUpload } from "@/components/FileUpload";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery({ projectId });
  const { data: proposals, isLoading: proposalsLoading, refetch: refetchProposals } = trpc.proposals.listByProject.useQuery({ projectId });
  const { data: subsystems, isLoading: subsystemsLoading } = trpc.projects.getSubsystems.useQuery({ projectId });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingProposals = proposals?.filter((p) => p.status === "pending_review") || [];

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
        <p className="text-muted-foreground mb-4">{project.description}</p>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{project.status.replace("_", " ").toUpperCase()}</Badge>
          <span className="text-sm text-muted-foreground">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <ProjectActions
        projectId={projectId}
        projectStatus={project.status}
        onActionComplete={() => refetchProposals()}
      />

      {/* File Attachments Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
          <FileUpload projectId={projectId} onUploadComplete={() => {}} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Attached Files</h3>
          <AttachmentsList projectId={projectId} />
        </div>
      </div>

      {pendingProposals.length > 0 && (
        <Card className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              You have {pendingProposals.length} proposal{pendingProposals.length !== 1 ? "s" : ""} waiting for review
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="proposals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="proposals">
            Proposals
            {pendingProposals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingProposals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="structure">Project Structure</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-4">
          {proposalsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No proposals yet</p>
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal) => (
              <ProposalReview
                key={proposal.id}
                proposal={proposal}
                onReviewed={() => refetchProposals()}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          {subsystemsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !subsystems || subsystems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No subsystems defined yet. The AI PM will create the project structure after strategy approval.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {subsystems.map((subsystem) => (
                <Card key={subsystem.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{subsystem.name}</CardTitle>
                        <CardDescription>{subsystem.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {subsystem.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Project Knowledge Base</CardTitle>
              <CardDescription>
                Context and decisions accumulated throughout the project lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Knowledge base viewer coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
