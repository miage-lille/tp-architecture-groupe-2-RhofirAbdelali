import { differenceInDays } from 'date-fns';
import { Entity } from 'src/shared/entity';

type WebinarProps = {
  id: string;
  organizerId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  seats: number;
  remainingSeats: number;
};

export class Webinar extends Entity<WebinarProps> {
  isTooSoon(now: Date): boolean {
    const diff = differenceInDays(this.props.startDate, now);
    return diff < 3;
  }

  hasTooManySeats(): boolean {
    return this.props.seats > 1000;
  }

  hasNotEnoughSeats(): boolean {
    return this.props.remainingSeats < 1;
  }

  isOrganizer(userId: string): boolean {
    return this.props.organizerId === userId;
  }

  reduceSeats(): void {
    if (this.hasNotEnoughSeats()) {
      throw new Error('Not enough seats available.');
    }
    this.props.remainingSeats -= 1;
  }
}