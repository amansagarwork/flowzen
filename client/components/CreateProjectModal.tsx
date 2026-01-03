import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "./ui/textarea";
import { toast } from "@/lib/toast";
import { FolderPlus } from "lucide-react";
import { AppleSpinner } from "./ui/apple-spinner";

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateProjectModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Project name is required");
            return;
        }

        setLoading(true);
        try {
            const GraphQL_ENDPOINT = "http://localhost:5000/graphql";
            const token = localStorage.getItem("flowzen_token");

            const createProjectMutation = {
                query: `
          mutation CreateProject($input: ProjectInput!) {
    createProject(input: $input) {
        id
        name
        description
        status
        health
    }
}
`,
                variables: {
                    input: {
                        name,
                        description,
                    },
                },
            };

            const response = await fetch(GraphQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token} `,
                },
                body: JSON.stringify(createProjectMutation),
            });

            const result = await response.json();

            if (result.errors) {
                toast.error(result.errors[0].message);
            } else if (result.data?.createProject) {
                toast.success("Project created successfully!");
                onSuccess?.();
                onOpenChange(false);
                // Reset form
                setName("");
                setDescription("");
            }
        } catch (error) {
            toast.error("Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/50 backdrop-blur-xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderPlus className="w-5 h-5 text-primary" />
                            Create New Project
                        </DialogTitle>
                        <DialogDescription>
                            Add a new project to your FlowZen dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup className="py-4">
                        <Field>
                            <FieldLabel htmlFor="name">Project Name</FieldLabel>
                            <Input
                                id="name"
                                placeholder="e.g. My Awesome SaaS"
                                value={name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="description">Description</FieldLabel>
                            <Textarea
                                id="description"
                                placeholder="What is this project about?"
                                value={description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                disabled={loading}
                                className="resize-none"
                                rows={3}
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="min-w-[120px]">
                            {loading ? (
                                <>
                                    <AppleSpinner size="sm" className="mr-2" />
                                    Creating...
                                </>
                            ) : (
                                "Create Project"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
