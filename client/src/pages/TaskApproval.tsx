import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Code,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { toast } from "sonner";

export default function TaskApproval() {
    const [selectedProject, setSelectedProject] = useState<number | null>(null);

    // Get projects
    const { data: projects } = trpc.projects.list.useQuery();

    // Get pending tasks for selected project
    const { data: pendingTasks, refetch } = trpc.taskExport.getPendingTasks.useQuery(
        { projectId: selectedProject! },
        { enabled: selectedProject !== null }
    );

    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Task Approval</h1>
                <p className="text-muted-foreground">
                    Review and approve AI-generated implementation plans
                </p>
            </div>

            {/* Project Selector */}
            <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Select Project</label>
                <select
                    className="w-full max-w-md px-3 py-2 border rounded-md"
                    value={selectedProject || ""}
                    onChange={(e) => setSelectedProject(Number(e.target.value))}
                >
                    <option value="">Choose a project...</option>
                    {projects?.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.name} ({project.status})
                        </option>
                    ))}
                </select>
            </div>

            {/* Pending Tasks */}
            {selectedProject && (
                <div className="space-y-4">
                    {pendingTasks && pendingTasks.length === 0 && (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No pending tasks for this project</p>
                            </CardContent>
                        </Card>
                    )}

                    {pendingTasks?.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            projectId={selectedProject}
                            onApprove={() => refetch()}
                            onReject={() => refetch()}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface TaskCardProps {
    task: any;
    projectId: number;
    onApprove: () => void;
    onReject: () => void;
}

function TaskCard({ task, projectId, onApprove, onReject }: TaskCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);

    const generateMutation = trpc.taskExport.generateTaskSpec.useMutation();
    const approveMutation = trpc.taskExport.approveTask.useMutation();
    const rejectMutation = trpc.taskExport.rejectTask.useMutation();

    const handleGenerateSpec = async () => {
        try {
            const result = await generateMutation.mutateAsync({
                projectId,
                taskId: task.id,
                researchSummary: "Task spec generated from orchestrator",
            });

            toast.success("Task spec generated!", {
                description: `Created ${result.taskId} - Ready for approval`,
            });
        } catch (error) {
            toast.error("Failed to generate task spec", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const handleApprove = async () => {
        try {
            await approveMutation.mutateAsync({
                taskId: `task-${task.id}`,
                projectId,
                feedback,
            });

            toast.success("Task approved!", {
                description: "Task moved to .tasks/current-task.json for IDE execution",
            });
            onApprove();
        } catch (error) {
            toast.error("Failed to approve task", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const handleReject = async () => {
        if (!feedback.trim()) {
            toast.error("Feedback required", {
                description: "Please provide feedback for rejection",
            });
            return;
        }

        try {
            await rejectMutation.mutateAsync({
                taskId: `task-${task.id}`,
                projectId,
                feedback,
            });

            toast.success("Task rejected", {
                description: "Feedback sent to AI PM for revision",
            });
            onReject();
        } catch (error) {
            toast.error("Failed to reject task", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const getStatusBadge = () => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
            pending: "secondary",
            assigned: "default",
            in_progress: "default",
            blocked: "destructive",
        };

        return (
            <Badge variant={variants[task.status] || "default"}>
                {task.status}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{task.title}</CardTitle>
                            {getStatusBadge()}
                        </div>
                        <CardDescription>{task.description}</CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-4">
                    {/* Requirements */}
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Requirements
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {task.requirements}
                        </p>
                    </div>

                    {/* Agent Assignment */}
                    {task.assignedAgentId && (
                        <div>
                            <h4 className="font-semibold mb-2">Assigned Agent</h4>
                            <p className="text-sm text-muted-foreground">Agent ID: {task.assignedAgentId}</p>
                        </div>
                    )}

                    {/* Task Spec Generation */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Implementation Plan</h4>

                        <div className="space-y-3">
                            <Button
                                onClick={handleGenerateSpec}
                                disabled={generateMutation.isPending}
                                className="w-full"
                            >
                                <Code className="w-4 h-4 mr-2" />
                                {generateMutation.isPending ? "Generating..." : "Generate Task Specification"}
                            </Button>

                            <p className="text-xs text-muted-foreground">
                                This will create a detailed task spec file in .tasks/queue/ for review
                            </p>
                        </div>
                    </div>

                    {/* Approval Actions */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Approval Actions</h4>

                        {!showFeedback && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleApprove()}
                                    disabled={approveMutation.isPending}
                                    className="flex-1"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => setShowFeedback(true)}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        )}

                        {showFeedback && (
                            <div className="space-y-3">
                                <Textarea
                                    placeholder="Provide feedback for the AI PM..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleReject}
                                        disabled={rejectMutation.isPending}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        Confirm Rejection
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowFeedback(false);
                                            setFeedback("");
                                        }}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {task.progressPercentage > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Progress</h4>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${task.progressPercentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {task.progressPercentage}%
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
