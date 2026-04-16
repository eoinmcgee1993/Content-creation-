"""LaunchWhere CLI — find where to launch and get platform-optimised copy."""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from generator import generate_copy
from platforms import score_platforms

app = typer.Typer(help="LaunchWhere: AI-powered launch platform recommender.")
console = Console()


@app.command()
def main(
    product: str = typer.Argument(..., help="Describe your product in a sentence."),
    top: int = typer.Option(3, help="Number of platforms to recommend."),
    generate: bool = typer.Option(True, help="Generate AI copy for each platform."),
):
    console.print(
        Panel(f"[bold cyan]LaunchWhere v1[/bold cyan]\n[dim]{product}[/dim]"),
        justify="center",
    )

    ranked = score_platforms(product)[:top]

    table = Table(title="Recommended Platforms", show_lines=True)
    table.add_column("#", style="dim", width=3)
    table.add_column("Platform", style="bold")
    table.add_column("Audience")
    table.add_column("URL", style="blue")

    for i, (platform, _score) in enumerate(ranked, 1):
        table.add_row(str(i), platform.name, platform.audience, platform.url)

    console.print(table)

    if generate:
        console.print("\n[bold]Generating launch copy…[/bold]\n")
        for platform, _ in ranked:
            copy = generate_copy(product, platform)
            console.print(
                Panel(
                    f"[bold]Title:[/bold] {copy['title']}\n\n"
                    f"[bold]Tagline:[/bold] {copy['tagline']}",
                    title=f"[cyan]{platform.name}[/cyan]",
                )
            )


if __name__ == "__main__":
    app()
