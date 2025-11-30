import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

export type TaskDetailModel = {
  id: string;
  title: string;
  description: string;
  status: string;
  progress_current: number;
  progress_target: number;
  assignees: { id: string; name: string }[];
  comments: { id: string; author: string; body: string; created_at: string }[];
};

export function TaskDetail({ task }: { task: TaskDetailModel }) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <div className="text-lg font-semibold">{task.title}</div>
        <div className="text-sm text-muted">{task.description}</div>
      </div>
      <div className="flex items-center gap-3">
        <Select defaultValue={task.status}>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Select>
        <Badge label={`${task.assignees.length} assignees`} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>
            {task.progress_current} / {task.progress_target}
          </span>
        </div>
        <Progress value={(task.progress_current / task.progress_target) * 100} />
        <Input type="number" defaultValue={task.progress_current} />
      </div>
      <div className="space-y-2">
        <div className="font-semibold text-sm">Comments</div>
        {task.comments.map((comment) => (
          <div key={comment.id} className="text-sm border border-border rounded-md p-2">
            <div className="text-xs text-muted">
              {comment.author} · {new Date(comment.created_at).toLocaleString()}
            </div>
            <div>{comment.body}</div>
          </div>
        ))}
        <Input placeholder="Add a comment" />
        <Button>Add comment</Button>
      </div>
    </Card>
  );
}
