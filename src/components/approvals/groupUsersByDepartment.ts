/**
 * 候補ユーザーを部署ごとにグループ化する（バックエンドの並び順を保持）
 */
export interface CandidateUser {
  id: string
  email: string
  display_name: string
  department: string
}

export function groupUsersByDepartment<T extends CandidateUser>(
  users: T[]
): Array<[string, T[]]> {
  const groups = new Map<string, T[]>()
  for (const u of users) {
    const dept = u.department || '部署未設定'
    if (!groups.has(dept)) groups.set(dept, [])
    groups.get(dept)!.push(u)
  }
  return [...groups.entries()]
}
