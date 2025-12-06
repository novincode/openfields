"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RiGithubFill, RiHeartLine } from "react-icons/ri";
import { CodeBlockRegistry } from "../../components/code-block-registry";

export default function ContributingPageClient() {
	return (
		<div className="space-y-8 max-w-3xl">
			<header className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Contributing</h1>
				<p className="text-lg text-muted-foreground">
					OpenFields is open source. Contributions are welcome!
				</p>
				<div className="flex flex-wrap gap-3 pt-2">
					<Button variant="outline" asChild>
						<a href="https://github.com/novincode/openfields" target="_blank" rel="noopener noreferrer">
							<RiGithubFill className="mr-2 size-4" />
							GitHub Repository
						</a>
					</Button>
					<Button variant="outline" asChild>
						<a href="https://github.com/sponsors/novincode" target="_blank" rel="noopener noreferrer">
							<RiHeartLine className="mr-2 size-4 text-destructive" />
							Sponsor
						</a>
					</Button>
				</div>
			</header>

			<Separator />

			{/* Getting Started */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Local Development</h2>
				<CodeBlockRegistry
					id="contrib-setup"
					lang="bash"
					code={`# Clone the repository
git clone https://github.com/novincode/openfields.git
cd openfields

# Start WordPress environment
npm run wp-env start

# Build admin interface
cd admin
npm install
npm run dev`}
				/>
				<p className="text-muted-foreground text-sm">
					Access WordPress at <code className="bg-muted px-1 rounded">http://localhost:8888</code>
				</p>
			</section>

			<Separator />

			{/* Project Structure */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Project Structure</h2>
				<CodeBlockRegistry
					id="contrib-structure"
					lang="text"
					code={`openfields/
├── plugin/           # WordPress plugin (PHP)
│   ├── includes/     # Core classes
│   └── assets/       # CSS/JS for meta boxes
├── admin/            # React admin interface
│   └── src/          # TypeScript source
└── docs/             # Internal documentation`}
				/>
			</section>

			<Separator />

			{/* Guidelines */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold">Guidelines</h2>
				<ul className="list-disc list-inside space-y-2 text-muted-foreground">
					<li>Follow WordPress coding standards for PHP</li>
					<li>Use TypeScript for all admin code</li>
					<li>Prefix all PHP functions with <code className="bg-muted px-1 rounded">openfields_</code></li>
					<li>Keep commits atomic and descriptive</li>
					<li>Add tests when possible</li>
				</ul>
			</section>

			<Separator />

			{/* Ways to Contribute */}
			<section className="space-y-4 pb-8">
				<h2 className="text-xl font-semibold">Ways to Contribute</h2>
				<ul className="list-disc list-inside space-y-2 text-muted-foreground">
					<li><strong>Report bugs</strong> — Open an issue on GitHub</li>
					<li><strong>Submit PRs</strong> — Bug fixes and features welcome</li>
					<li><strong>Improve docs</strong> — Help make documentation better</li>
					<li><strong>Share</strong> — Tell others about OpenFields</li>
					<li><strong>Sponsor</strong> — Support development financially</li>
				</ul>
			</section>
		</div>
	);
}
