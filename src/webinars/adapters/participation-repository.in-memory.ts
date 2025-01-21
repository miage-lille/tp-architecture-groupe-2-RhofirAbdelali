import { IParticipationRepository } from '../ports/participation-repository.interface';
import { Participation } from '../entities/participation.entity';

export class InMemoryParticipationRepository implements IParticipationRepository {
  private database: Participation[] = [];

  async findByWebinarId(webinarId: string): Promise<Participation[]> {
    return this.database.filter(participation => participation.props.webinarId === webinarId);
  }

  async save(participation: Participation): Promise<void> {
    this.database.push(participation);
  }
}