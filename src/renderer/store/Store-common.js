
export const compositeCommand = async commands => {
  const resolved = await Promise.all(commands)
  return {
    apply: () => Promise.all(resolved.map(command => command.apply())),
    inverse: () => this.commands.composite(resolved.reverse().map(command => command.inverse()))
  }
}
